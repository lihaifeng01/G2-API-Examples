import React from 'react';
import { Navigate, Outlet } from 'umi';

const Auth: React.FC = () => {
  // 检查用户是否已登录
  const isLoggedIn = () => {
    const token = localStorage.getItem('authToken');
    //return !!token;
    //这里默认用户已登录，实际应用中需要根据您的认证逻辑来判断
    return true;
  };

  if (!isLoggedIn()) {
    // 未登录则重定向到登录页,登录页需要接入您的认证逻辑
    return <Navigate to='/login' replace />;
  }
  return <Outlet />;
};

export default Auth;
