import React, { memo } from 'react';
import { Slider } from 'antd';
import { useModel } from 'umi';
import LeaveButton from '../leave-button';
import { rtc } from '../rtc-manager';
import CustomIcon from '../custom-icon';
import MicImg from '@/assets/controller/mic.png';
import MicOffImg from '@/assets/controller/mic_off.png';
import CameraImg from '@/assets/controller/camera.png';
import CameraOffImg from '@/assets/controller/camera_off.png';
import EffectImg from '@/assets/controller/effect.png';
import EffectOffImg from '@/assets/controller/effect_off.png';
import DenoiseImg from '@/assets/controller/denoise.png';
import styles from './index.less';

interface ControllerVisibleProps {
  video: boolean;
  screen: boolean;
  mic: boolean;
  effect: boolean;
  denoise: boolean;
}

interface ControllerProps {
  visible: ControllerVisibleProps;
}

const Controller: React.FC<ControllerProps> = ({ visible }) => {
  const { localVideo, setLocalVideo } = useModel('rtc');
  const [hasEffect, setHasEffect] = React.useState(true);

  const [voiceGateLevel, setVoiceGateLevel] = React.useState(15);
  const [showDenoiseSlider, setShowDenoiseSlider] = React.useState(false);

  const mic = {
    on: localVideo?.hasAudio,
    onChange: async (on: boolean) => {
      console.log('onChange mic', on);
      if (on) {
        await rtc.localStream?.unmuteAudio();
        if (localVideo) {
          setLocalVideo({
            ...localVideo,
            hasAudio: true,
            audioEnabled: true,
          });
        }
      } else {
        //使用mute代替close
        await rtc.localStream?.muteAudio();
        if (localVideo) {
          setLocalVideo({
            ...localVideo,
            hasAudio: false,
            audioEnabled: false,
          });
        }
      }
    },
  };
  const camera = {
    on: localVideo?.hasVideo,
    onChange: async (on: boolean) => {
      if (on) {
        await rtc.localStream?.open({ type: 'video' });
        if (localVideo) {
          setLocalVideo({
            ...localVideo,
            hasVideo: true,
            videoEnabled: true,
          });
        }
      } else {
        try {
          await rtc.localStream?.close({ type: 'video' });
          if (localVideo) {
            setLocalVideo({
              ...localVideo,
              hasVideo: false,
              videoEnabled: false,
            });
          }
        } catch (error) {
          console.error('Error closing video stream:' + error);
        }
      }
    },
  };

  const effect = {
    on: hasEffect,
    onChange: (on: boolean) => {
      if (on) {
        //招采场景变声默认值，详细说明请参考 https://doc.yunxin.163.com/nertc/guide/DU1MTA3ODM?platform=web#%E7%BE%8E%E5%A3%B0%E5%92%8C%E5%8F%98%E5%A3%B0
        rtc.client?.setAudioEffect(0, 4);
        setHasEffect(true);
      } else {
        //这里用0代替close,再次打开变声时更快
        rtc.client?.setAudioEffect(0, 0);
        setHasEffect(false);
      }
    },
  };

  const onSliderChange = (level: number) => {
    setVoiceGateLevel(level);
    rtc.localStream?.setVoiceGate(level);
  };

  return (
    <div className={styles.container}>
      {visible.mic && (
        <div className={styles.button} onClick={() => mic.onChange?.(!mic.on)}>
          <div className={styles.icon}>
            {mic.on ? <CustomIcon src={MicImg} /> : <CustomIcon src={MicOffImg} />}
          </div>
          <span className={styles.text}>{mic.on ? '关闭麦克风' : '开启麦克风'}</span>
        </div>
      )}
      {visible.video && (
        <div className={styles.button} onClick={() => camera.onChange?.(!camera.on)}>
          <div className={styles.icon}>
            {camera.on ? <CustomIcon src={CameraImg} /> : <CustomIcon src={CameraOffImg} />}
          </div>
          <span className={styles.text}>{camera.on ? '关闭摄像头' : '开启摄像头'}</span>
        </div>
      )}
      {visible.effect && (
        <div className={styles.button} onClick={() => effect.onChange?.(!effect.on)}>
          <div className={styles.icon}>
            {effect.on ? <CustomIcon src={EffectImg} /> : <CustomIcon src={EffectOffImg} />}
          </div>
          <span className={styles.text}>{effect.on ? '关闭变声' : '开启变声'}</span>
        </div>
      )}

      {visible.denoise && (
        <div className={styles.denoiseWrapper}>
          <div className={styles.button} onClick={() => setShowDenoiseSlider(!showDenoiseSlider)}>
            <div className={styles.icon}>
              <CustomIcon src={DenoiseImg} />
            </div>
            <span className={styles.text}>降噪</span>
          </div>
          {showDenoiseSlider && (
            <div className={styles.sliderContainer}>
              <Slider
                className={styles.slider}
                onChange={onSliderChange}
                min={0}
                max={50}
                step={1}
                value={voiceGateLevel}
              />
              <span className={styles.sliderValue}>{voiceGateLevel}</span>
            </div>
          )}
        </div>
      )}
      <LeaveButton className={styles.leave} />
    </div>
  );
};

export default memo(Controller);
