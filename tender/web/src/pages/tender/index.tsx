import React, { useEffect, memo, useCallback, useRef, useState } from 'react';
import { useModel, useSearchParams } from 'umi';
import PreviewLocal from '@/components/preview-local';
import PreviewRemote from '@/components/preview-remote';
import AttendeeList from '@/components/attendee-list';
import { rtc } from '@/components/rtc-manager';
import styles from './index.less';
import { Stream } from 'nertc-web-sdk/types/stream';
import { Empty, message, Modal, Spin } from 'antd';
import Controller from '@/components/controller';
import { history } from 'umi';
import { Role, AttendeeProps } from '@/types';
import { getAppToken } from '@/utils';
import { appkey, secret } from '@/config';
import { useRtcEvents } from '@/hooks/useRtcEvents';
import { RtcErrorHandler } from '@/components/rtc-error-handler';

interface ControllerVisibleProps {
  video: boolean;
  screen: boolean;
  mic: boolean;
  effect: boolean;
  denoise: boolean;
}

interface CustomDataProps {
  uid: string | number;
  userName?: string;
  role?: Role;
}

const initialControllerVisible: ControllerVisibleProps = {
  video: false,
  screen: false,
  mic: false,
  effect: false,
  denoise: false,
};

const Tender: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cname, uid, uname, role] = [
    searchParams.get('cname'),
    searchParams.get('uid') || '',
    searchParams.get('uname'),
    searchParams.get('role') as Role,
  ];

  const { localVideo, remoteVideos, setLocalVideo, setRemoteVideo } = useModel('rtc');
  const [controllerVisible, setControllerVisible] =
    useState<ControllerVisibleProps>(initialControllerVisible);
  const [attendeeList, setAttendeeList] = useState<AttendeeProps[]>([]);
  const [customDataArray, setCustomDataArray] = useState<CustomDataProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  //维护加入房间和离开房间的人员列表
  const [onlineList, setOnlineList] = useState<string[]>([]);
  const rtcEvents = useRtcEvents(
    rtc,
    localVideo,
    remoteVideos,
    setLocalVideo,
    setRemoteVideo,
    setCustomDataArray,
    setAttendeeList,
    setOnlineList,
  );

  //初始化本端流
  useEffect(() => {
    if (!cname || !uid || !role) {
      console.error('Invalid parameters:', { cname, uid, role });
      return;
    }
    let checkCount = 0;
    //初始化rtc
    rtc.initClient();
    checkAndInit(cname, uid);
    //底部会控
    getControlList();

    //检查各角色的流是否存在,不存在时重新init
    async function checkAndInit(cname: string, uid: string) {
      await initRtc();
      const checkResult = checkStreamExist();
      if (!checkResult) {
        console.log('Stream does not exist, initializing RTC...');
        checkCount++;
        if (role === 'expert') {
          message.warning('请授予摄像头，麦克风，屏幕共享权限');
        }
        if (role === 'agent') {
          message.warning('请授予麦克风权限');
        }

        //申请权限失败三次后，三秒后关闭页面
        if (checkCount >= 3) {
          await rtc.localStream?.destroy();
          RtcErrorHandler.handlePermissionError(() => {
            history.push({
              pathname: '/default',
            });
          });
          return;
        }
        // 递归调用，继续检查
        await checkAndInit(cname, uid);
      } else {
        console.log('Stream exists, proceeding to join channel...');
        setLoading(true);
        // 先开启远端流变声，后加入频道，以保证听到的是变声后的音频
        await rtc.enableAudioEffects();
        setLoading(false);
        const token = await getAppToken({
          appkey: appkey,
          secret: secret,
          channelName: cname,
          uid: uid,
        });
        if (!token) {
          message.error('获取token失败，请检查网络');
          return;
        }
        try {
          await rtc.joinChannel({
            channelName: cname,
            uid: uid,
            token,
            customData: getCustomData(role as string),
          });

          if (role === 'expert') {
            setLocalVideo({
              stream: rtc.localStream as Stream,
              hasVideo: rtc.localStream?.hasVideo() || false,
              videoEnabled: rtc.localStream?.hasVideo() || false,
              hasScreen: rtc.localStream?.hasScreen() || false,
              screenEnabled: rtc.localStream?.hasScreen() || false,
              hasAudio: rtc.localStream?.hasAudio() || false,
              audioEnabled: rtc.localStream?.hasAudio() || false,
            });
            await rtc.publish();
            rtc.enableAIDenoise();
          } else if (role === 'agent') {
            setLocalVideo({
              stream: rtc.localStream as Stream,
              hasVideo: false,
              videoEnabled: false,
              hasScreen: false,
              screenEnabled: false,
              hasAudio: rtc.localStream?.hasAudio() || false,
              audioEnabled: rtc.localStream?.hasAudio() || false,
            });
            await rtc.publish();
            rtc.enableAIDenoise();
          }
        } catch (error) {
          Modal.error({
            title: '加入频道失败',
            content: '请检查网络连接或频道名称是否正确',
            onOk: () => {
              history.push({
                pathname: '/default',
              });
            },
          });
          console.error('Error joining channel:', error);
        }
      }
    }
    //初始化rtc
    async function initRtc() {
      try {
        // role为专家时，发布视频，音频，屏幕共享
        // role为主持人时，发布音频
        // role为监督时，作为观众，不发布
        if (role === 'expert') {
          try {
            await rtc.localStream?.destroy();
            await rtc.initLocalStream({
              uid: uid,
              video: true,
              screen: true,
              audio: true,
            });
          } catch (error) {
            console.error('Error initializing local stream:', error);
          }
        } else if (role === 'agent') {
          await rtc.initLocalStream({
            uid: uid,
            audio: true,
            video: false,
            screen: false,
          });
        } else if (role === 'supervisor') {
          rtc.client?.setClientRole('audience');
        } else {
          console.error('Invalid role:', role);
        }
      } catch (error) {
        console.error('Error initializing RTC:', error);
      }
    }

    //检查各角色的流是否存在
    function checkStreamExist() {
      if (role === 'expert') {
        return (
          rtc.localStream?.hasVideo() && rtc.localStream?.hasScreen() && rtc.localStream?.hasAudio()
        );
      } else if (role === 'agent') {
        return rtc.localStream?.hasAudio();
      } else if (role === 'supervisor') {
        return true;
      }
      return false;
    }

    //根据角色获取控制列表
    function getControlList() {
      switch (role) {
        case 'expert':
          setControllerVisible({
            video: true,
            screen: true,
            mic: true,
            effect: false,
            denoise: true,
          });
          break;
        case 'agent':
          setControllerVisible({
            video: false,
            screen: false,
            mic: true,
            effect: true,
            denoise: true,
          });
          break;
        case 'supervisor':
          setControllerVisible({
            video: false,
            screen: false,
            mic: false,
            effect: false,
            denoise: false,
          });
          break;
        default:
          break;
      }
    }

    //根据角色获取customData
    function getCustomData(role: string) {
      switch (role) {
        case 'expert':
        case 'agent':
          return JSON.stringify({
            userName: uname,
            role: role,
            uid: uid,
          });
        default:
          break;
      }
    }

    return () => {
      console.log('离开页面，销毁rtc');
      //离开频道
      rtc.leaveChannel();
    };
  }, []);

  //更新参会人员列表
  useEffect(() => {
    console.log(
      '更新参会人员列表',
      localVideo?.stream.getId(),
      remoteVideos,
      customDataArray,
      onlineList,
    );
    //更新远端流状态
    const newAttendeeList: AttendeeProps[] = remoteVideos.map(video => ({
      uid: video.stream.getId() as string,
      userName:
        customDataArray.find(item => {
          return item.uid === video.stream.getId();
        })?.userName || '',
      audioEnabled: video.audioEnabled || false,
      videoEnabled: video.videoEnabled || false,
      screenEnabled: video.screenEnabled || false,
      online: onlineList.includes(video.stream.getId() as string),
    }));
    //本端流状态加入newAttendeeList
    if (localVideo?.stream) {
      newAttendeeList.unshift({
        uid: localVideo.stream.getId() as string,
        userName: uname || '',
        audioEnabled: localVideo.audioEnabled || false,
        videoEnabled: localVideo.videoEnabled || false,
        screenEnabled: localVideo.screenEnabled || false,
        online: true,
      });
    }

    setAttendeeList(newAttendeeList);
  }, [localVideo, remoteVideos, customDataArray, onlineList]);

  //处理RTC事件
  useEffect(() => {
    rtc.client?.on('stream-added', rtcEvents.handleStreamAdded);
    rtc.client?.on('stream-removed', rtcEvents.handleStreamRemoved);
    rtc.client?.on('TrackEnded', rtcEvents.handleTrackEnded);
    rtc.client?.on('stream-subscribed', rtcEvents.handleStreamSubscribed);
    //@ts-ignore
    rtc.client?.on('@stream-unsubscribed', rtcEvents.handleStreamUnSubscribed);
    rtc.client?.on('custom-data', rtcEvents.handleCustomData);
    rtc.client?.on('mute-audio', rtcEvents.handleMuteAudio);
    rtc.client?.on('unmute-audio', rtcEvents.handleUnmuteAudio);
    rtc.client?.on('network-quality', rtcEvents.handleNetworkQuality);
    rtc.client?.on('uid-duplicate', rtcEvents.handleUIDDuplicate);
    rtc.client?.on('connection-state-change', rtcEvents.handleConnectionStateChange);
    rtc.client?.on('error', rtcEvents.handleClientError);
    rtc.client?.on('peer-online', rtcEvents.handlePeerOnline);
    rtc.client?.on('peer-leave', rtcEvents.handlePeerOffline);

    return () => {
      rtc.client?.off('stream-added', rtcEvents.handleStreamAdded);
      rtc.client?.off('stream-removed', rtcEvents.handleStreamRemoved);
      rtc.client?.off('TrackEnded', rtcEvents.handleTrackEnded);
      rtc.client?.off('stream-subscribed', rtcEvents.handleStreamSubscribed);
      rtc.client?.off('@stream-unsubscribed', rtcEvents.handleStreamUnSubscribed);
      rtc.client?.off('custom-data', rtcEvents.handleCustomData);
      rtc.client?.off('mute-audio', rtcEvents.handleMuteAudio);
      rtc.client?.off('unmute-audio', rtcEvents.handleUnmuteAudio);
      rtc.client?.off('network-quality', rtcEvents.handleNetworkQuality);
      rtc.client?.off('uid-duplicate', rtcEvents.handleUIDDuplicate);
      rtc.client?.off('connection-state-change', rtcEvents.handleConnectionStateChange);
      rtc.client?.off('error', rtcEvents.handleClientError);
      rtc.client?.off('peer-online', rtcEvents.handlePeerOnline);
      rtc.client?.off('peer-leave', rtcEvents.handlePeerOffline);
    };
  }, [rtcEvents]);

  return (
    <Spin spinning={loading} tip='正在加载中...'>
      <div className={styles.tender_container}>
        <div className={styles.video_preview_container}>
          {role === 'expert' ? (
            <PreviewLocal
              attendee={
                attendeeList.filter(item => item.uid === localVideo?.stream?.getId())[0] || {}
              }
            />
          ) : remoteVideos.length > 0 ? (
            <PreviewRemote role={role} attendeeList={attendeeList} />
          ) : (
            <Empty description='暂无视频' />
          )}
        </div>
        <Controller visible={controllerVisible} />
        <div className={styles.list_container}>
          <AttendeeList attendees={attendeeList} role={role} />
        </div>
      </div>
    </Spin>
  );
};

export default memo(Tender);
