import React from 'react';
import defaultImg from '@/assets/default.png'; // Default image path

const DefaultPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <img
          src={defaultImg} // Replace with your actual image path
          style={styles.image}
        />
        <p style={styles.text}>已退出评标间，如需继续可重新通过入会链接进入</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  image: {
    width: '120px',
    marginBottom: '24px',
  },
  text: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
  },
};

export default DefaultPage;
