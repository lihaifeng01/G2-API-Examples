/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState, useRef } from 'react';
import { history, createSearchParams } from 'umi';
import { Button, Input, message, notification, Tooltip } from 'antd';
import { checkChrome, getHashSearch } from '@/utils';
import styles from './index.less';
import inviteInputAvatarIcon from '@/assets/invite_input_avatar_icon.png';
import num1 from '@/assets/invite_num_1.png';
import num2 from '@/assets/invite_num_2.png';
import num3 from '@/assets/invite_num_3.png';
//import checkGreyIcon from '@/assets/invite_check_grey_icon.png';
import checkBlueIcon from '@/assets/invite_check_blue_icon.png';
import checkXIcon from '@/assets/invite_x_icon.png';
import invitePreviewVideoClose from '@/assets/invite_preview_video_close.png';
import invitePreviewAuidoIcon from '@/assets/invite_preview_auido_icon.png';
import invitePreviewVideoIcon from '@/assets/invite_preview_video_icon.png';
import invitePreviewVideoCloseIcon from '@/assets/invite_preview_video_close_icon.png';
import inviteSelectIcon from '@/assets/invite_shangsanjiao_icon.png';
import inviteGouxuanIcon from '@/assets/invite_gouxuan_icon.png';

import { appkey } from '@/config';
import * as NERTC from 'nertc-web-sdk';
import { Client } from 'nertc-web-sdk/types/client';
import { Stream } from 'nertc-web-sdk/types/stream';

const Home: React.FC = () => {
  const microphoneDeviceListRef = useRef(null);
  const cameraDeviceListRef = useRef(null);
  const [disabled, setDisabled] = useState(false);
  const [uname, setUname] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [isChrome, setIsChrome] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  const [isOpenVideo, setIsOpenVideo] = useState(true);
  const [microphoneDeviceList, setMicrophoneDeviceList] = useState<
    { deviceId: string; label: string }[]
  >([]);
  const [cameraDeviceList, setCameraDeviceList] = useState<{ deviceId: string; label: string }[]>(
    [],
  );
  const [showMicrophoneDeviceList, setShowMicrophoneDeviceList] = useState(false);
  const [showCameraDeviceList, setShowCameraDeviceList] = useState(false);
  const [selectedMicrophoneDevice, setSelectedMicrophoneDevice] = useState('');
  const [selectedCameraDevice, setSelectedCameraDevice] = useState('');
  const [rtcConfig, setRtcConfig] = useState({
    cname: '',
    uid: '',
    role: '',
  });

  const clientRef = useRef<Client | undefined>(undefined);
  const localStreamRef = useRef<Stream | undefined>(undefined);
  //跳转到/tender
  const goToTender = () => {
    console.log('接入评标室会议 用户名称uname: ', uname);
    console.log('接入评标室会议 用户名称rtcConfig: ', rtcConfig);
    if (!uname) {
      console.log('请填写姓名');
      notification.error({
        message: `请填写姓名`,
        placement: 'top',
      });
      return;
    }
    // 将设备信息保存到 sessionStorage 中,在招标页面初始本端流化时使用
    sessionStorage.setItem('microphoneId', selectedMicrophoneDevice);
    sessionStorage.setItem('cameraId', selectedCameraDevice);

    history.push({
      pathname: '/tender',
      search: createSearchParams({ ...rtcConfig, ...{ uname } }).toString(),
    });
  };
  useEffect(() => {
    //获取入会链接的信息
    const queryString = getHashSearch(location.hash);
    const params = new URLSearchParams(queryString);
    const role = params.get('role');
    const cname = params.get('cname');
    const uid = params.get('uid');
    console.log(`获取到会议 canme: ${cname}, uid: ${uid}, role: ${uid}`);
    if (!role || !cname || !uid) {
      setDisabled(true);
      console.log('参数不完整');
      message.error('评标会议地址不正确，无法进入会议');
      return;
    }

    switch (role) {
      case 'expert':
        setRoleTitle('评标专家');
        break;
      case 'agent':
        setRoleTitle('代理 (主持人)');
        break;
      case 'supervisor':
        setRoleTitle('监督');
        break;
      default:
        break;
    }
    setRtcConfig({
      cname: cname as string,
      uid: uid as string,
      role: role as string,
    });

    if (!clientRef.current) {
      console.log('创建 client');
      clientRef.current = NERTC.createClient({
        appkey: appkey,
        debug: true,
      });
      console.log('创建 localstream');
      try {
        localStreamRef.current = NERTC.createStream({
          video: role === 'expert' ? true : false,
          audio: true,
          client: clientRef.current,
        }) as Stream;
      } catch (error) {
        console.error('创建 localStream 失败:', error);
        message.error('创建本地流失败，请检查浏览器设置或重试');
        setDisabled(true);
        return;
      }

      console.log('前置准备工作');
      if (role == 'agent') {
        //代理不需要检测摄像头
        setHasVideoPermission(true);
      }
      //前置准备工作
      checkEnvironment(role);
    }

    //控制麦克风&摄像头设备列表的显示
    const handleClickOutside = (event: MouseEvent) => {
      if (
        microphoneDeviceListRef.current &&
        //@ts-ignore
        !microphoneDeviceListRef.current.contains(event.target as Node)
      ) {
        setShowMicrophoneDeviceList(false);
      }

      if (
        cameraDeviceListRef.current &&
        //@ts-ignore
        !cameraDeviceListRef.current.contains(event.target as Node)
      ) {
        setShowCameraDeviceList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      console.log('清除 localStream: ', localStreamRef.current);
      localStreamRef.current?.destroy();
      //@ts-ignore
      clientRef.current?.removeAllListeners();
    };
  }, []);

  const checkEnvironment = async (role: string) => {
    try {
      initEvents();
      // 检查浏览器环境（推荐Chrome浏览器）
      if (checkChrome()) {
        setIsChrome(true);
      } else {
        setIsChrome(false);
        setDisabled(true);
      }
      // 检查麦克风、摄像头权限
      await localStreamRef.current?.init();
      if (localStreamRef.current?.hasAudio()) {
        setHasAudioPermission(true);
        //获取麦克风设备列表
        const microphoneDevices = await NERTC.getMicrophones();
        setMicrophoneDeviceList(microphoneDevices);
      } else {
        setDisabled(true);
      }
      if (localStreamRef.current?.hasVideo()) {
        setHasVideoPermission(true);
        //获取摄像头设备列表
        const cameraDeviceList = await NERTC.getCameras();
        setCameraDeviceList(cameraDeviceList);
        //渲染摄像头视频
        await localStreamRef.current?.play(
          document.getElementById('previewVideoDom') as HTMLElement,
        );
        localStreamRef.current?.setLocalRenderMode({
          width: 707,
          height: 468,
          cut: true,
        });
      } else {
        setIsOpenVideo(false);
        if (role !== 'agent') {
          //代理不需要检测摄像头
          setDisabled(true);
        }
      }
    } catch (error: unknown) {
      console.error('Error checking environment:', error);
      setIsOpenVideo(false);
      notification.error({
        message: `评标会议前置检查异常: ${(error as Error).message}`,
        placement: 'top',
      });
    }
  };

  const initEvents = () => {
    //@ts-ignore
    clientRef.current.removeAllListeners();
    clientRef.current?.on('accessDenied', type => {
      console.warn(`${type} 设备权限被禁止了`);
      type == 'audio' ? setHasAudioPermission(false) : setHasVideoPermission(false);
      notification.error({
        message: `${type} 设备权限被禁止了，请检查系统设置或者浏览器设置`,
        placement: 'top',
      });
    });
    clientRef.current?.on('notFound', type => {
      console.warn(`${type} 设备没有找到`);
      type == 'audio' ? setHasAudioPermission(false) : setHasVideoPermission(false);
      notification.error({
        message: `${type} 设备没有找到，请插入设备`,
        placement: 'top',
      });
    });
    clientRef.current?.on('beOccupied', type => {
      console.warn(`${type} 设备不可用, 系统或者设备驱动异常引起`);
      type == 'audio' ? setHasAudioPermission(false) : setHasVideoPermission(false);
      notification.error({
        message: `${type} 设备不可用, 系统或者设备驱动异常引起，请重启浏览器或者重启电脑系统`,
        placement: 'top',
      });
    });
    clientRef.current?.on('deviceError', type => {
      console.warn(`${type} 设备不支持设置的profile参数`);
      type == 'audio' ? setHasAudioPermission(false) : setHasVideoPermission(false);
      notification.error({
        message: `${type} 设备不支持设置的profile参数, 请换一个设备`,
        placement: 'top',
      });
    });
    //@ts-ignore
    localStreamRef.current?.removeAllListeners();
    localStreamRef.current?.on('device-error', data => {
      console.warn('设备异常:', data);
      // notification.error({
      //   message: `${type} 设备异常, reason:${data.error.message}`,
      //   placement: 'top',
      // });
    });
  };

  // 渲染检查项
  const renderCheckItem = (
    number: string,
    title: string,
    status: boolean,
    subText?: string,
    onSubTextClick?: () => void,
  ) => (
    <div className={styles.check_item}>
      <div className={styles.item_left}>
        <div className={styles.item_number}>
          <img src={number} className={styles.icon_medium} />
        </div>
        <div className={styles.item_text}>
          <div className={styles.text_main}>{title}</div>
          {subText && (
            <div className={styles.text_sub} onClick={onSubTextClick}>
              {subText}
            </div>
          )}
        </div>
      </div>
      <div
        className={`${styles.status_icon} ${status ? styles.status_success : styles.status_failed}`}
      >
        <img src={status ? checkBlueIcon : checkXIcon} className={styles.icon_check} />
      </div>
    </div>
  );

  // 渲染设备选择弹窗
  const renderDeviceModal = (
    title: string,
    deviceList: { deviceId: string; label: string }[],
    selectedDevice: string,
    onDeviceSelect: (deviceId: string) => void,
  ) => (
    <div className={styles.device_modal}>
      <div className={styles.modal_title}>{title}</div>
      {deviceList?.length > 0 &&
        deviceList.map(item => (
          <div
            className={styles.modal_item}
            key={item.deviceId}
            onClick={() => onDeviceSelect(item.deviceId)}
          >
            {selectedDevice === item.deviceId && (
              <img src={inviteGouxuanIcon} className={styles.icon_selected} />
            )}
            <div className={styles.modal_text}>{item.label}</div>
          </div>
        ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.left_panel}>
        <div className={styles.title_line} />
        <div className={styles.title}>音视频评标室演示项目</div>

        <div className={styles.avatar_area}>
          <div className={styles.avatar_icon}></div>
          <div className={styles.avatar_text}>{roleTitle}</div>
        </div>

        <Input
          className={styles.input_name}
          placeholder='请填写姓名'
          maxLength={10}
          value={uname}
          onChange={e => setUname(e.target.value)}
          prefix={<img src={inviteInputAvatarIcon} className={styles.icon_avatar} />}
        />

        <div className={styles.pre_title}>前置准备工作</div>
        <div className={styles.check_list}>
          {renderCheckItem(
            num1,
            'Chrome浏览器环境检测',
            isChrome,
            !isChrome ? '下载 Chrome 浏览器' : undefined,
            () => {
              console.log('跳转到Chrome下载地址');
              const link = document.createElement('a');
              link.href = 'https://www.google.cn/chrome/';
              link.target = '_blank'; // 新标签页打开
              link.click();
            },
          )}

          {renderCheckItem(num2, '音频权限获取', hasAudioPermission)}

          {renderCheckItem(num3, '视频权限获取', hasVideoPermission)}
        </div>
      </div>

      <div className={styles.right_panel}>
        {isOpenVideo ? (
          <div className={styles.video_area} id='previewVideoDom'></div>
        ) : (
          <div className={styles.video_area}>
            <div>
              <img src={invitePreviewVideoClose} className={styles.icon_video} />
            </div>
            <div className={styles.video_text}>摄像头未开启</div>
          </div>
        )}

        <div className={styles.control_area}>
          {/* 音频设备按钮 */}
          <div className={`${styles.device_btn} ${styles.audio_btn}`}>
            <div>
              <img src={invitePreviewAuidoIcon} className={styles.icon_device} />
            </div>
            <div onClick={() => setShowMicrophoneDeviceList(true)}>
              <img src={inviteSelectIcon} className={styles.icon_select} />
            </div>
            {showMicrophoneDeviceList &&
              renderDeviceModal(
                '请选择音频来源',
                microphoneDeviceList,
                selectedMicrophoneDevice,
                deviceId => {
                  setSelectedMicrophoneDevice(deviceId);
                  setShowMicrophoneDeviceList(false);
                  // 添加设备切换逻辑
                },
              )}
          </div>

          {/* 视频设备按钮 */}
          <div className={`${styles.device_btn} ${styles.video_btn}`}>
            <div>
              <img
                src={isOpenVideo ? invitePreviewVideoIcon : invitePreviewVideoCloseIcon}
                className={styles.icon_device}
              />
            </div>
            <div onClick={() => setShowCameraDeviceList(true)}>
              <img src={inviteSelectIcon} className={styles.icon_select} />
            </div>
            {showCameraDeviceList &&
              renderDeviceModal(
                '请选择视频来源',
                cameraDeviceList,
                selectedCameraDevice,
                deviceId => {
                  setSelectedCameraDevice(deviceId);
                  setShowCameraDeviceList(false);
                  // 添加设备切换逻辑
                },
              )}
          </div>

          {/* 进入评标室按钮 */}
          <Tooltip title={disabled ? '请检查前置准备工作并符合要求后重试' : ''}>
            <Button
              className={`${styles.enter_btn} ${disabled ? styles.btn_disabled : styles.btn_enabled}`}
              type='primary'
              disabled={disabled}
              onClick={goToTender}
            >
              进入评标室
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Home;
