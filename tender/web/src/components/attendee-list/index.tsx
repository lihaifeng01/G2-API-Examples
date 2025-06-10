import React, { memo, useCallback } from 'react';
import { List, Space, Card } from 'antd';
import { rtc } from '../rtc-manager';
import CustomIcon from '../custom-icon';
import MicImg from '@/assets/controller/mic.png';
import MicOffImg from '@/assets/controller/mic_off.png';
import CameraImg from '@/assets/controller/camera.png';
import CameraOffImg from '@/assets/controller/camera_off.png';
import { Role } from '@/types';
import styles from './index.less';

interface Attendee {
  uid: string;
  userName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  online: boolean;
}

interface AttendeeListProps {
  attendees: Attendee[];
  role: Role;
  title?: string;
}

const AttendeeList: React.FC<AttendeeListProps> = ({ attendees, title = '参会列表', role }) => {
  // 下载参会人员列表
  const downloadAttendeeList = useCallback(() => {
    const { cid, channelName } = rtc.getChannelInfo() || {};
    const data = attendees.map(attendee => ({
      uid: attendee.uid,
      userName: attendee.userName,
    })) as any;
    data.unshift({
      cid: cid,
    });
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendee_list_${channelName}_${new Date().toLocaleString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [attendees]);

  return (
    <Card
      title={title}
      extra={role == 'agent' ? <a onClick={downloadAttendeeList}>保存</a> : null}
      className={styles.attendeeList}
    >
      <List
        dataSource={attendees.filter(attendee => attendee.online)}
        className={styles.list}
        renderItem={attendee => (
          <List.Item key={attendee.uid}>
            <div className={styles.item}>
              <span>{attendee.userName}</span>
              <Space>
                {attendee.audioEnabled ? (
                  <CustomIcon src={MicImg} width={20} height={20} />
                ) : (
                  <CustomIcon src={MicOffImg} width={20} height={20} />
                )}
                {attendee.videoEnabled ? (
                  <CustomIcon src={CameraImg} width={20} height={20} />
                ) : (
                  <CustomIcon src={CameraOffImg} width={20} height={20} />
                )}
              </Space>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default memo(AttendeeList);
