import React, { useCallback } from 'react';
import { memo } from 'react';
import GoodImg from '@/assets/signal/good.png';
import NormalImg from '@/assets/signal/normal.png';
import BadImg from '@/assets/signal/bad.png';
import styles from './index.less';

export enum NetworkStatus {
  UNKNOWN = 0,
  EXCELLENT = 1,
  GOOD = 2,
  POOR = 3,
  BAD = 4,
  VERYBAD = 5,
  DOWN = 6,
}

interface DescriptionProps {
  networkStatus: NetworkStatus;
  userName: string;
}

const Description: React.FC<DescriptionProps> = ({ networkStatus, userName }) => {
  const getImg = useCallback(() => {
    switch (networkStatus) {
      case NetworkStatus.UNKNOWN:
      case NetworkStatus.EXCELLENT:
      case NetworkStatus.GOOD:
        return GoodImg;
      case NetworkStatus.POOR:
        return NormalImg;
      case NetworkStatus.BAD:
      case NetworkStatus.VERYBAD:
        return BadImg;
      default:
        return GoodImg;
    }
  }, [networkStatus]);
  return (
    <div className={styles.description}>
      <img src={getImg()} className={styles.networkStatus}></img>
      <span className={styles.userName}>{userName}</span>
    </div>
  );
};

export default memo(Description);
