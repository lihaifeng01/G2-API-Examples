import { useCallback } from 'react';
import { Stream } from 'nertc-web-sdk/types/stream';
import { MediaType, NetStatusItem, ConnectionState } from 'nertc-web-sdk/types/types';
import { VideoProps } from '@/types';
import { Modal } from 'antd';
import { RtcErrorHandler } from '@/components/rtc-error-handler';

export function useRtcEvents(
  rtc: any,
  localVideo: VideoProps | null,
  remoteVideos: VideoProps[],
  setLocalVideo: (video: VideoProps) => void,
  setRemoteVideo: (videoOrUpdater: VideoProps | ((prev: VideoProps[]) => VideoProps[])) => void,
  setCustomDataArray: (callback: (prev: any[]) => any[]) => void,
  setAttendeeList: (callback: (prev: any[]) => any[]) => void,
  setOnlineList: (callback: (prev: any[]) => any[]) => void,
) {
  // 远端流添加事件
  const handleStreamAdded = useCallback((evt: { stream: Stream; mediaType: MediaType }) => {
    const { stream, mediaType } = evt;
    console.log('stream-added', stream.getId(), mediaType);

    const updates: Partial<VideoProps> = {
      stream,
      subscribe: false,
    };

    if (mediaType === 'video') updates.videoEnabled = true;
    else if (mediaType === 'audio') updates.audioEnabled = true;
    else if (mediaType === 'screen') updates.screenEnabled = true;

    setRemoteVideo(updates as VideoProps);
    if (mediaType == 'audio') {
      rtc.client?.subscribe(stream, { audio: true }).then(() => {
        console.log('subscribe success');
      });
    }
  }, []);

  // 远端流移除事件
  const handleStreamRemoved = useCallback(async (evt: { stream: Stream; mediaType: MediaType }) => {
    console.log('stream-removed', evt.stream);
    const { stream, mediaType } = evt;
    await stream.stop(mediaType);

    const updates: Partial<VideoProps> = {
      stream,
      subscribe: false,
    };

    if (mediaType === 'video') {
      updates.videoEnabled = false;
    } else if (mediaType === 'screen') {
      updates.screenEnabled = false;
    } else if (mediaType === 'audio') {
      updates.audioEnabled = false;
    }

    setRemoteVideo(updates as VideoProps);
  }, []);

  // 远端流订阅成功事件
  const handleStreamSubscribed = useCallback(
    (evt: { stream: Stream; mediaType: MediaType }) => {
      console.log('stream-subscribed', evt.stream.getId(), evt.mediaType);
      const { stream, mediaType } = evt;

      const updates: Partial<VideoProps> = {
        stream,
        subscribe: false,
      };

      if (mediaType === 'video') updates.hasVideo = true;
      else if (mediaType === 'audio') updates.hasAudio = true;
      else if (mediaType === 'screen') updates.hasScreen = true;

      setRemoteVideo(updates as VideoProps);

      if (evt.mediaType === 'audio') {
        if (rtc.firstPlay) {
          rtc.firstPlay = false;
          Modal.confirm({
            title: '提示',
            content: '请点击确定按钮，播放音频',
            okText: '确定',
            cancelText: '取消',
            onOk() {
              remoteVideos.forEach(item => playAudio(item.stream));
            },
            onCancel() {
              remoteVideos.forEach(item => playAudio(item.stream));
            },
          });
        } else {
          console.log('play audio', stream);
          playAudio(stream);
        }
      }

      function playAudio(stream: Stream) {
        //@ts-ignore
        stream.play(null, {
          audio: true,
          video: false,
          screen: false,
          mixAudioStream: true,
        });
      }
    },
    [remoteVideos],
  );

  // 远端流取消订阅事件
  const handleStreamUnSubscribed = useCallback((evt: { stream: Stream; mediaType: MediaType }) => {
    console.warn('stream-unsubscribed', evt.stream, evt.mediaType);
    const { stream, mediaType } = evt;

    //更新远端流状态
    const updates: Partial<VideoProps> = {
      stream,
      subscribe: false,
    };
    if (mediaType === 'video') {
      updates.hasVideo = false;
    } else if (mediaType === 'screen') {
      updates.hasScreen = false;
    } else if (mediaType === 'audio') {
      updates.hasAudio = false;
    }
    setRemoteVideo(updates as VideoProps);
  }, []);

  // 远端流静音事件
  const handleMuteAudio = useCallback((evt: { uid: string | number }) => {
    console.warn('收到静音消息: ', evt);
    const { uid } = evt;
    setRemoteVideo((prevRemoteVideos: VideoProps[]) => {
      const index = prevRemoteVideos.findIndex(item => item.stream?.getId() === uid);
      if (index > -1) {
        const newVideos = [...prevRemoteVideos];
        newVideos[index] = {
          ...newVideos[index],
          hasAudio: false,
          audioEnabled: false,
        };
        return newVideos;
      }

      return prevRemoteVideos;
    });
  }, []);

  // 远端流取消静音事件
  const handleUnmuteAudio = useCallback((evt: { uid: string | number }) => {
    console.warn('收到取消静音消息: ', evt);
    const { uid } = evt;
    setRemoteVideo((prevRemoteVideos: VideoProps[]) => {
      const index = prevRemoteVideos.findIndex(item => item.stream?.getId() === uid);
      if (index > -1) {
        const newVideos = [...prevRemoteVideos];
        newVideos[index] = {
          ...newVideos[index],
          hasAudio: true, // 更新音频状态为取消静音
          audioEnabled: true, // 更新音频状态为取消静音
        };
        return newVideos;
      }

      return prevRemoteVideos;
    });
  }, []);

  const handleCustomData = useCallback((evt: { uid: string | number; customData: string }) => {
    console.warn('收到自定义消息: ', evt);
    const { uid, customData } = evt;
    const custom = JSON.parse(customData);
    //custom.userName = uid;

    setCustomDataArray(prevArray => {
      if (!prevArray.includes(custom)) {
        return [...prevArray, custom];
      }
      return prevArray;
    });
  }, []);

  const handleNetworkQuality = useCallback((netStatus: NetStatusItem[]) => {
    setAttendeeList(prevAttendeeList => {
      const newAttendeeList = prevAttendeeList.map(item => {
        const status = netStatus.find(status => status.uid === item.uid);
        if (status) {
          return {
            ...item,
            downlinkNetworkQuality: status.downlinkNetworkQuality,
            uplinkNetworkQuality: status.uplinkNetworkQuality,
          };
        }
        return item;
      });

      if (newAttendeeList.length > 0) {
        return newAttendeeList;
      }

      return prevAttendeeList;
    });
  }, []);

  const handlePeerOnline = useCallback((evt: { uid: string | number }) => {
    console.log('peer-online', evt);
    const { uid } = evt;
    setOnlineList(pre => {
      const existingPeer = pre.find(peer => peer === uid);
      if (!existingPeer) {
        return [...pre, uid];
      }
      return pre;
    });
  }, []);

  const handlePeerOffline = useCallback((evt: { uid: string | number }) => {
    console.log('peer-offline', evt);
    const { uid } = evt;
    setOnlineList(pre => {
      //过滤掉下线的uid
      return pre.filter(peer => peer !== uid);
    });
  }, []);

  // 使用错误处理类处理媒体流异常
  const handleTrackEnded = useCallback(
    (mediaType: 'video' | 'audio' | 'screen' | 'screenAudio') => {
      RtcErrorHandler.handleTrackEnded(mediaType, localVideo, setLocalVideo);
    },
    [localVideo, setLocalVideo],
  );

  // 处理UID重复
  const handleUIDDuplicate = useCallback(() => {
    RtcErrorHandler.handleUIDDuplicate();
  }, []);

  //处理网络连接状态变化
  const handleConnectionStateChange = useCallback(
    (evt: { curState: ConnectionState; prevState: ConnectionState; reconnect: boolean }) => {
      RtcErrorHandler.handleConnectionStateChange(evt);
    },
    [],
  );

  //Client错误处理
  const handleClientError = useCallback((type: string) => {
    //处理网络异常导致的退出房间
    if (type === 'SOCKET_ERROR') {
      RtcErrorHandler.handleNetworkError();
    }
  }, []);

  return {
    handleStreamAdded,
    handleStreamRemoved,
    handleStreamSubscribed,
    handleStreamUnSubscribed,
    handleMuteAudio,
    handleUnmuteAudio,
    handleCustomData,
    handleNetworkQuality,
    handleTrackEnded,
    handleUIDDuplicate,
    handleConnectionStateChange,
    handleClientError,
    handlePeerOnline,
    handlePeerOffline,
  };
}
