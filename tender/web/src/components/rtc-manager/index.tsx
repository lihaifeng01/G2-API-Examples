import * as NERTC from 'nertc-web-sdk';
import AIAudioEffects from 'nertc-web-sdk/NERTC_Web_SDK_AIAudioEffects.js';
import { Client } from 'nertc-web-sdk/types/client';
import { Stream } from 'nertc-web-sdk/types/stream';
import { EventEmitter } from 'eventemitter3';
import { Role } from '@/types';
import { appkey, pluginWasmUrl, enableRecord, privateServer, neRtcServerAddresses } from '@/config';
import { simd } from 'wasm-feature-detect';

export enum NERTC_VIDEO_QUALITY_ENUM {
  VIDEO_QUALITY_180p = 2,
  VIDEO_QUALITY_480p = 4,
  VIDEO_QUALITY_720p = 8,
  VIDEO_QUALITY_1080p = 16,
}

export enum VIDEO_FRAME_RATE_ENUM {
  CHAT_VIDEO_FRAME_RATE_NORMAL = 0,
  CHAT_VIDEO_FRAME_RATE_5 = 1,
  CHAT_VIDEO_FRAME_RATE_10 = 2,
  CHAT_VIDEO_FRAME_RATE_15 = 3,
  CHAT_VIDEO_FRAME_RATE_20 = 4,
  CHAT_VIDEO_FRAME_RATE_25 = 5,
  CHAT_VIDEO_FRAME_RATE_30 = 6,
}

export interface VideoProfileOptions {
  resolution: NERTC_VIDEO_QUALITY_ENUM;
  frameRate: VIDEO_FRAME_RATE_ENUM;
}

export type AudioProfileTypes =
  | 'speech_low_quality'
  | 'speech_standard'
  | 'music_standard'
  | 'standard_stereo'
  | 'high_quality'
  | 'high_quality_stereo';

interface RtcConfig {
  channelName: string;
  uid: string | number;
  token: string;
  customData?: string;
}

interface RemoteStreamArray {
  [key: string]: Stream;
}

class RtcManager extends EventEmitter {
  public client: Client | null = null;
  public localStream: Stream | null = null;
  public remoteStreams: RemoteStreamArray = {};
  private role: Role = 'expert'; //默认角色为专家
  public firstPlay: boolean = true; //是否第一次播放远端流

  constructor() {
    super();
    //开启日志上传
    NERTC.Logger.enableLogUpload();
  }

  initClient() {
    this.client = NERTC.createClient({
      appkey: appkey,
      debug: true,
    });
    this._initRtcEvents();
  }

  async joinChannel(config: RtcConfig) {
    const { channelName, uid, token } = config;
    return this.client?.join({
      channelName,
      uid,
      token,
      customData: config.customData,
      //云端录制
      joinChannelRecordConfig: enableRecord
        ? {
            recordAudio: true,
            recordVideo: true,
            recordType: 0,
            isHostSpeaker: false,
          }
        : undefined,
      //私有化
      neRtcServerAddresses: privateServer ? neRtcServerAddresses : undefined,
    });
  }

  async initLocalStream(config: { uid: string; audio: boolean; video: boolean; screen: boolean }) {
    const cameraId = sessionStorage.getItem('cameraId') || '';
    const microphoneId = sessionStorage.getItem('microphoneId') || '';
    this.localStream = NERTC.createStream({
      uid: config.uid,
      video: config.video,
      screen: config.screen,
      audio: config.audio,
      cameraId: cameraId,
      microphoneId: microphoneId,
    }) as Stream;
    //主流建议使用480p/15fps
    const videoProfile = {
      resolution: NERTC_VIDEO_QUALITY_ENUM.VIDEO_QUALITY_480p,
      frameRate: VIDEO_FRAME_RATE_ENUM.CHAT_VIDEO_FRAME_RATE_15,
    };
    this.localStream.setVideoProfile(videoProfile);
    //音频建议使用speech_standard
    const audioProfile = 'speech_standard';
    this.localStream.setAudioProfile(audioProfile);
    //屏幕共享建议使用1080p/15fps
    const screenProfile = {
      resolution: NERTC_VIDEO_QUALITY_ENUM.VIDEO_QUALITY_1080p,
      frameRate: VIDEO_FRAME_RATE_ENUM.CHAT_VIDEO_FRAME_RATE_15,
    };
    //屏幕共享强制共享整个屏幕
    //@ts-ignore
    NERTC.getParameters().forceDisplaySurface = 'monitor';
    this.localStream.setScreenProfile(screenProfile);
    //关闭AGC
    this.localStream.setAudioProcessing('audio', {
      AGC: false,
    });
    return this.localStream.init();
  }

  async publish() {
    if (!this.localStream) {
      throw new Error('Local stream is not initialized');
    }
    return this.client?.publish(this.localStream);
  }

  //订阅远端流
  subscribeStream(stream: Stream, role: Role) {
    console.warn('subscribeStream', stream.getId(), role);
    const subscribeConfig = {
      video: role === 'expert' ? false : true,
      audio: true,
      screen: role === 'expert' ? false : true,
    };
    stream.setSubscribeConfig(subscribeConfig);
    this.client?.subscribe(stream).then(() => {
      console.log('subscribe success');
    });
  }

  //取消订阅远端流
  unsubscribeStream(stream: Stream) {
    console.log('unsubscribeStream', stream.getId());
    const unsubscribeConfig = {
      video: true,
      audio: false,
      screen: true,
    };
    return this.client?.unsubscribe(stream, unsubscribeConfig);
  }

  async enableAIDenoise() {
    const supportSimd = await simd();
    const config = {
      key: 'AIAudioEffects',
      pluginObj: AIAudioEffects,
      wasmUrl: supportSimd ? pluginWasmUrl.simd : pluginWasmUrl.nosimd,
    } as any;
    this.localStream?.on('plugin-load', key => {
      if (key === 'AIAudioEffects') {
        console.log('AIAudioEffects plugin loaded');
        this.localStream?.enableAIDenoise();
      }
    });

    this.localStream?.on('ai-denoise-enabled', () => {
      console.log('AI降噪已开启');
      this.localStream?.setVoiceGate(15);
    });
    this.localStream?.registerPlugin(config);
  }

  async enableAudioEffects() {
    return new Promise<void>(async (resolve, reject) => {
      const supportSimd = await simd();
      const config = {
        key: 'AIAudioEffects',
        pluginObj: AIAudioEffects,
        wasmUrl: supportSimd ? pluginWasmUrl.simd : pluginWasmUrl.nosimd,
      } as any;
      console.log('开始注册插件');
      //@ts-ignore
      this.client?.on('plugin-load', key => {
        if (key === 'AIAudioEffects') {
          console.log('audioEffects插件加载成功');
          //@ts-ignore
          this.client?.on('audio-effect-enabled', () => {
            //招采场景变声默认值，详细说明请参考 https://doc.yunxin.163.com/nertc/guide/DU1MTA3ODM?platform=web#%E7%BE%8E%E5%A3%B0%E5%92%8C%E5%8F%98%E5%A3%B0
            console.log('变声已开启');
            this.client?.setAudioEffect(0, 4);
            resolve();
          });
          this.client?.enableAudioEffect();
        }
      });

      this.client?.registerPlugin(config);
    });
  }

  getChannelInfo() {
    return this.client?.getChannelInfo();
  }

  leaveChannel() {
    return rtc.client?.destroy();
  }

  //RTC事件监听
  _initRtcEvents() {
    //禁言
    this.client?.on('audioVideoBanned', evt => {
      if (evt.state) {
        console.warn(
          `监听到服务器禁言,  uid: ${evt.uid}, 媒体类型: ${evt.mediaType}, 禁言状态: ${evt.state}, 禁言时间: ${evt.duration}s  `,
        );
      } else {
        console.warn(
          `监听到服务器解开禁言,  uid: ${evt.uid}, 媒体类型: ${evt.mediaType}, 禁言状态: ${evt.state}, 禁言时间: ${evt.duration}s  `,
        );
      }
      this.emit('audioVideoBanned', evt);
    });
  }

  destroy() {}
}
const rtc = new RtcManager();
//@ts-ignore 方便在控制台排查问题，可删除该行代码
window.rtc = rtc;
export { rtc };
