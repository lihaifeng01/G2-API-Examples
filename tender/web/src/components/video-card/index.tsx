import React, { useCallback, memo, useEffect } from 'react';
import { Row, Col, Empty } from 'antd';
import styles from './index.less';
import { Stream } from 'nertc-web-sdk/types/stream';
import CameraOffImg from '@/assets/camera_off.png';
import ScreenImg from '@/assets/screen.png';
import ScreenOffImg from '@/assets/screen_off.png';
import FullScreen from '@/assets/full_screen.png';
import Description from '../description';
import { VideoProps, AttendeeProps } from '@/types';

interface VideoCardProps {
  video: VideoProps;
  isRemote: boolean;
  attendee?: AttendeeProps;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isRemote, attendee }) => {
  const { stream, hasVideo, hasScreen } = video;
  const videoReference = React.useRef<HTMLDivElement>(null);
  const screenReference = React.useRef<HTMLDivElement>(null);

  const setRenderMode = useCallback(
    (stream: Stream, element: HTMLElement, mediaType: 'video' | 'screen', isRemote: boolean) => {
      if (!element) {
        return;
      }

      if (isRemote) {
        stream?.setRemoteRenderMode(
          {
            width: element.clientWidth,
            height: element.clientHeight,
            cut: true,
          },
          mediaType,
        );
      } else {
        stream?.setLocalRenderMode(
          {
            width: element.clientWidth,
            height: element.clientHeight,
            cut: true,
          },
          mediaType,
        );
      }
    },
    [],
  );

  const playMedia = useCallback(
    (element: HTMLDivElement | null, mediaType: 'video' | 'screen', hasMedia?: boolean) => {
      if (!element || !stream || !hasMedia) {
        return;
      }
      // 如果是屏幕共享且为本端流，不播放
      if (mediaType === 'screen' && !isRemote) {
        return;
      }

      console.log(`开始播放${mediaType === 'video' ? '视频' : '屏幕共享'}`);
      setRenderMode(stream, element, mediaType, isRemote);
      stream.play(element, {
        video: mediaType === 'video',
        screen: mediaType === 'screen',
        audio: false,
        muted: false,
      });
    },
    [stream, isRemote, setRenderMode],
  );

  useEffect(() => {
    playMedia(videoReference.current, 'video', hasVideo);
  }, [stream, hasVideo, playMedia]);

  useEffect(() => {
    playMedia(screenReference.current, 'screen', hasScreen);
  }, [stream, hasScreen, playMedia]);

  //监听videReference和screenReference的宽高变化，重新调用setRenderMode
  useEffect(() => {
    const videoElement = videoReference.current;
    const screenElement = screenReference.current;

    const resizeObserver = new ResizeObserver(() => {
      if (videoElement) {
        setRenderMode(stream, videoElement, 'video', isRemote);
      }
      if (screenElement) {
        setRenderMode(stream, screenElement, 'screen', isRemote);
      }
    });

    if (videoElement) {
      resizeObserver.observe(videoElement);
    }
    if (screenElement) {
      resizeObserver.observe(screenElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [stream, isRemote, setRenderMode]);

  const onClickFullScreen = useCallback(() => {
    if (screenReference.current) {
      const screenElementContainer = screenReference.current;
      const screenElement = screenElementContainer.querySelector('video');
      if (!screenElement) {
        return;
      }
      if (screenElement.requestFullscreen) {
        screenElement.requestFullscreen();
      }
    }
  }, [screenReference]);

  const renderEmpty = (image: string, description: string) => (
    <div className={styles.empty}>
      <Empty
        image={image}
        description={description}
        styles={{ image: { width: 40, height: 40, margin: '0 auto 8px' } }}
      />
    </div>
  );

  return (
    <div className={`${styles.container} ${isRemote ? styles.remote : styles.local}`}>
      <div className={styles.videoWrapper}>
        <div className={styles.video_container} ref={videoReference} stream-type='video'>
          {hasVideo ? null : (
            <div className={styles.empty}>{renderEmpty(CameraOffImg, '未开启摄像头')}</div>
          )}

          <div className={styles.description}>
            <Description
              userName={isRemote && attendee?.userName ? attendee.userName : ''}
              networkStatus={
                isRemote
                  ? attendee?.downlinkNetworkQuality || 0
                  : attendee?.uplinkNetworkQuality || 0
              }
            />
          </div>
        </div>
      </div>
      <div className={styles.screenWrapper}>
        <div className={styles.screen_container} ref={screenReference} stream-type='screen'>
          {hasScreen && !isRemote ? (
            <div className={styles.empty}>{renderEmpty(ScreenImg, '正在共享屏幕')}</div>
          ) : !hasScreen ? (
            <div className={styles.empty}>{renderEmpty(ScreenOffImg, '未开启屏幕共享')}</div>
          ) : null}

          <div className={styles.description}>
            <Description
              userName={(isRemote && attendee?.userName ? attendee.userName : '') + ' 桌面'}
              networkStatus={
                isRemote
                  ? attendee?.downlinkNetworkQuality || 0
                  : attendee?.uplinkNetworkQuality || 0
              }
            />
          </div>
          {isRemote ? (
            <div className={styles.fullscreen} onClick={onClickFullScreen}>
              <img src={FullScreen} alt='全屏' />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default memo(VideoCard);
