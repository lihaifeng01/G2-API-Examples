import React, { useState } from 'react';

import { Divider } from 'antd';
import styles from './index.less'; // You'll need to create this CSS module file

interface NavProps {
  logoSrc: string;
  appName: string;
  userRole?: string;
}

const Nav: React.FC<NavProps> = ({ logoSrc, appName, userRole }) => {
  return (
    <nav className={styles.nav}>
      <div className={styles.leftSection}>
        <img src={logoSrc} alt='Logo' className={styles.logo} />
        <Divider type='vertical' className={styles.divider} />
        <span className={styles.appName}>{appName}</span>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.userInfo}>
          {userRole && (
            <>
              <span className={styles.role}>登录角色: </span>
              <span className={styles.userRole}>{userRole}</span>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav;
