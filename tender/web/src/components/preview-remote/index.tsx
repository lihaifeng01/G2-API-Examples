import React, { useState, useCallback, memo } from 'react';
import { useModel } from 'umi';
import VideoPreview from '../video-preview';
import { Role, AttendeeProps } from '@/types';
import LeftImg from '@/assets/left.png';
import RightImg from '@/assets/right.png';
import styles from './index.less';

import usePaginatedVideos from '@/hooks/usePaginatedVideos'; // 新创建的hook

interface PreviewProps {
  role: Role;
  attendeeList?: AttendeeProps[];
}

const PreviewRemote: React.FC<PreviewProps> = ({ role, attendeeList = [] }) => {
  const { remoteVideos } = useModel('rtc');
  const { currentPage, pageSize, currentVideos, handlePrevPage, handleNextPage, hasNext, hasPrev } =
    usePaginatedVideos(remoteVideos, 2, role);

  return (
    <div className={styles.container}>
      <VideoPreview videos={currentVideos} isRemote={true} attendeeList={attendeeList} />

      {/* 分页控制 */}
      {remoteVideos.length > pageSize && (
        <>
          <div className={`${styles.page} ${styles.left}`}>
            <img src={LeftImg} alt='上一页' onClick={handlePrevPage} />
          </div>
          <div className={`${styles.page} ${styles.right}`}>
            <img src={RightImg} alt='下一页' onClick={handleNextPage} />
          </div>
        </>
      )}
    </div>
  );
};

export default memo(PreviewRemote);
