import { ConnectionState } from 'nertc-web-sdk/types/types';
import { history } from 'umi';
import { message, Modal } from 'antd';
import { VideoProps } from '@/types';
import { rtc } from '../rtc-manager';

// 错误处理
export class RtcErrorHandler {
  // 处理媒体流异常结束
  static handleTrackEnded = (
    mediaType: 'video' | 'audio' | 'screen' | 'screenAudio',
    localVideo: VideoProps | null,
    setLocalVideo: (video: VideoProps) => void,
  ) => {
    switch (mediaType) {
      case 'screen':
        console.log('screen ended');
        if (!rtc.localStream) {
          return;
        }
        // 异常关闭时，需要主动调用一次close()来更新localStream内部的状态
        rtc.localStream?.close({
          type: 'screen',
        });
        console.log('close screen', localVideo);
        if (localVideo) {
          setLocalVideo({
            ...localVideo,
            hasScreen: false,
            screenEnabled: false,
          });
        }
        Modal.warning({
          content: '屏幕共享已异常关闭，请刷新页面重新进入',
          onOk: () => {
            location.reload();
          },
        });
        break;
      case 'video':
        console.log('video ended');
        rtc.localStream?.close({
          type: 'video',
        });
        if (localVideo) {
          setLocalVideo({
            ...localVideo,
            hasVideo: false,
            videoEnabled: false,
          });
        }
        Modal.warning({ content: '摄像头已异常关闭，请刷新页面重新进入' });
        break;
      case 'audio':
        console.log('audio ended');
        rtc.localStream?.close({
          type: 'audio',
        });
        if (localVideo) {
          setLocalVideo({
            ...localVideo,
            hasAudio: false,
            audioEnabled: false,
          });
        }
        Modal.warning({ content: '麦克风已异常关闭，请刷新页面重新进入' });
        break;
    }
  };

  // 处理UID重复登录
  static handleUIDDuplicate = () => {
    console.warn('UID重复，离开频道');
    Modal.error({
      title: '提示',
      content: '当前用户已在其他设备登录',
      okText: '确定',
      onOk() {
        history.push({
          pathname: '/default',
        });
      },
    });
  };

  // 处理网络错误
  static handleConnectionStateChange = ({
    curState,
    prevState,
    reconnect,
  }: {
    curState: ConnectionState;
    prevState: ConnectionState;
    reconnect: boolean;
  }) => {
    console.log('connection-state-change', prevState, curState, reconnect);
    if (prevState == 'CONNECTED' && curState == 'CONNECTING' && reconnect) {
      console.warn('网络异常，正在重连');
      message.warning('网络异常，正在重连');
    }
    if (prevState == 'CONNECTING' && curState == 'CONNECTED' && reconnect) {
      console.warn('网络恢复');
      message.success('网络已恢复');
    }
  };

  //网络异常退出房间
  static handleNetworkError = () => {
    Modal.error({
      title: '网络异常',
      content: '请检查网络连接状态',
      onOk: () => {
        history.push({
          pathname: '/default',
        });
      },
    });
  };

  // 处理权限错误
  static handlePermissionError = (callback?: () => void) => {
    Modal.error({
      title: '权限错误',
      content: '请检查摄像头、麦克风、屏幕共享权限设置',
      onOk: callback,
    });
  };
}
