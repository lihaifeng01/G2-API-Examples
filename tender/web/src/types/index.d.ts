//角色类型：专家，代理人，监督
export type Role = 'expert' | 'agent' | 'supervisor';

//参会人
export interface AttendeeProps {
  uid: string;
  userName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenEnabled: boolean;
  online: boolean; // 是否在线
  downlinkNetworkQuality?: number;
  uplinkNetworkQuality?: number;
}

//网络信号
export type NetworkStatus = 'good' | 'normal' | 'bad';

/*
 * 对Stream做扩展
 * videoEnabled、screenEnabled、audioEnabled 表示是否存在对应的流
 * 对于localStream，本地流开启时为true，关闭时为false；对于remoteStream，触发stream-added事件时为true，触发stream-removed事件时为false
 * hasVideo、hasScreen、hasAudio 表示是否已开启对应的流
 * 对于localStream，本地流开启时为true，关闭时为false；对于remoteStream，触发stream-subscribed事件时为true，触发stream-unsubscribed事件时为false
 *
 * 注意：本示例中使用muteAudio来代替close()方法来关闭音频流，所以在mute-audio事件中，hasAudio和audioEnabled会同时变为false
 *      如果使用close()方法来关闭音频流，则需要参照video的逻辑来处理
 * */
export interface VideoProps {
  stream: Stream; // NERTC Stream 对象
  hasVideo?: boolean; // 是否已开启视频流
  hasScreen?: boolean; // 是否已开启屏幕共享流
  hasAudio?: boolean; // 是否已开启音频流
  videoEnabled?: boolean; // 是否存在视频流
  screenEnabled?: boolean; // 是否存在屏幕共享流
  audioEnabled?: boolean; // 是否存在音频流
  subscribe?: boolean;
}
