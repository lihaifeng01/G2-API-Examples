import { useState, useEffect, useMemo, useCallback } from 'react';
import { useModel } from 'umi';
import { Role, VideoProps } from '@/types';
import { rtc } from '@/components/rtc-manager';

export default function usePaginatedVideos(videos: VideoProps[], pageSize: number, role: Role) {
  const [currentPage, setCurrentPage] = useState(1);
  const { setRemoteVideo } = useModel('rtc');

  // 分页信息
  const totalPages = Math.ceil(videos.length / pageSize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  // 计算当前页面显示的视频
  const currentVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return videos.slice(startIndex, startIndex + pageSize);
  }, [currentPage, videos, pageSize]);

  // 订阅当前页面的视频
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagVideos = videos.slice(startIndex, endIndex);

    // 订阅当前页面的视频
    pagVideos.forEach(video => {
      if (video.stream && !video.subscribe) {
        rtc.subscribeStream(video.stream, role);
        video.subscribe = true;
        setRemoteVideo(video);
      }
    });
  }, [currentPage, videos, pageSize, role, setRemoteVideo]);

  // 取消订阅当前页面的视频
  const unsubscribeCurrentVideos = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const pagVideos = videos.slice(startIndex, startIndex + pageSize);

    pagVideos.forEach(video => {
      if (video.stream && video.subscribe) {
        rtc.unsubscribeStream(video.stream);
        video.subscribe = false;
        setRemoteVideo(video);
      }
    });
  }, [currentPage, videos, pageSize, setRemoteVideo]);

  // 处理页面变化
  const handleNextPage = useCallback(() => {
    if (hasNext) {
      unsubscribeCurrentVideos();
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNext, unsubscribeCurrentVideos]);

  const handlePrevPage = useCallback(() => {
    if (hasPrev) {
      unsubscribeCurrentVideos();
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrev, unsubscribeCurrentVideos]);

  return {
    currentPage,
    pageSize,
    currentVideos,
    handleNextPage,
    handlePrevPage,
    hasNext,
    hasPrev,
    totalPages,
  };
}
