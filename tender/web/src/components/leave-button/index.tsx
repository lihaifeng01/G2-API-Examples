import React, { useState, memo } from 'react';
import { Modal, Button } from 'antd';
import { rtc } from '../rtc-manager';
import { history } from 'umi';
import { getHashSearch } from '@/utils';

interface LeaveButtonProps {
  className?: string;
}

const LeaveButton: React.FC<LeaveButtonProps> = ({ className }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleConfirm = async () => {
    await rtc.leaveChannel();
    setIsModalVisible(false);
    history.push({
      pathname: '/default',
    });
  };

  return (
    <div className={className}>
      <Button type='primary' danger onClick={showModal}>
        离开评标室
      </Button>
      <Modal
        title='确认离开'
        open={isModalVisible}
        onOk={handleConfirm}
        onCancel={handleCancel}
        okText='确定'
        cancelText='取消'
      >
        <p>当前评标会议进行中，请确认是否仍然退出？</p>
      </Modal>
    </div>
  );
};

export default memo(LeaveButton);
