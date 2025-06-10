import React, { memo } from 'react';
import VideoCard from '../video-card';
import styles from './index.less';
import { VideoProps } from '@/types';
import { AttendeeProps } from '@/types';
import { Empty } from 'antd';

interface VideoPreviewProps {
  videos: VideoProps[];
  isRemote: boolean;
  attendeeList?: AttendeeProps[];
  pagination?: boolean;
  emptyText?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videos,
  isRemote,
  attendeeList = [],
  emptyText = '暂无视频',
}) => {
  if (!videos || videos.length === 0) {
    return <Empty description={emptyText} />;
  }

  return (
    <div className={styles.preview}>
      {videos.map(video => {
        const attendee = attendeeList.find(item => item.uid === video.stream?.getId());

        return (
          <VideoCard
            key={video.stream?.getId()}
            video={video}
            isRemote={isRemote}
            attendee={attendee}
          />
        );
      })}
    </div>
  );
};

export default memo(VideoPreview);
