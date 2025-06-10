import { useSetState } from 'ahooks';
import { VideoProps } from '@/types';

interface RtcState {
  localVideo: VideoProps | null;
  remoteVideos: VideoProps[];
}

const initialState = {
  localVideo: null,
  remoteVideos: [],
};

export default function useRtcModel() {
  const [state, setState] = useSetState<RtcState>(initialState);

  const setLocalVideo = (video: VideoProps) => {
    console.log('setLocalVideo', video);
    setState({
      localVideo: video,
    });
  };

  const setRemoteVideo = (videoOrUpdater: VideoProps | ((prev: VideoProps[]) => VideoProps[])) => {
    if (typeof videoOrUpdater === 'function') {
      // 函数式更新
      setState(pre => {
        const newRemoteVideos = videoOrUpdater(pre.remoteVideos);
        console.log('setRemoteVideo (function)', pre.remoteVideos, newRemoteVideos);
        return { remoteVideos: newRemoteVideos };
      });
    } else {
      // 普通对象更新
      setState(pre => {
        const video = videoOrUpdater;
        console.log('setRemoteVideo', pre.remoteVideos, video);
        let newRemoteVideos: VideoProps[];
        const index = pre.remoteVideos.findIndex(
          item => item.stream?.getId() === video.stream?.getId(),
        );

        if (index > -1) {
          // 合并现有状态
          const existingVideo = pre.remoteVideos[index];
          const mergedVideo = {
            ...existingVideo,
            // 仅更新提供的属性
            stream: 'stream' in video ? video.stream : existingVideo.stream,
            hasVideo: 'hasVideo' in video ? video.hasVideo : existingVideo.hasVideo,
            hasAudio: 'hasAudio' in video ? video.hasAudio : existingVideo.hasAudio,
            hasScreen: 'hasScreen' in video ? video.hasScreen : existingVideo.hasScreen,
            subscribe: 'subscribe' in video ? video.subscribe : existingVideo.subscribe,
            videoEnabled: 'videoEnabled' in video ? video.videoEnabled : existingVideo.videoEnabled,
            screenEnabled:
              'screenEnabled' in video ? video.screenEnabled : existingVideo.screenEnabled,
            audioEnabled: 'audioEnabled' in video ? video.audioEnabled : existingVideo.audioEnabled,
          };

          newRemoteVideos = [...pre.remoteVideos];
          newRemoteVideos[index] = mergedVideo;
        } else {
          newRemoteVideos = [...pre.remoteVideos, video];
        }

        return { remoteVideos: newRemoteVideos };
      });
    }
  };

  return {
    state,
    ...state,
    setLocalVideo,
    setRemoteVideo,
  };
}
