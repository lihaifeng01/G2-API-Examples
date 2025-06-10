import React, { memo } from 'react';
import { useModel } from 'umi';
import VideoPreview from '@/components/video-preview';
import { AttendeeProps } from '@/types';

interface PreviewProps {
  attendee?: AttendeeProps;
}

const PreviewLocal: React.FC<PreviewProps> = ({ attendee }) => {
  const { localVideo } = useModel('rtc');

  return (
    <VideoPreview
      videos={localVideo ? [localVideo] : []}
      isRemote={false}
      attendeeList={attendee ? [attendee] : []}
      emptyText='本地视频未初始化'
    />
  );
};

export default memo(PreviewLocal);
