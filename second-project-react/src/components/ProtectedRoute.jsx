import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = useSelector(state => state.user.user);

  if (!user) {
    // 로딩 중일 수도 있으니 잠시 기다리거나 빈 화면 처리
    return <div>Loading...</div>;
  }

  if (!user.auth) {
    return <Navigate to="/" replace />;
  }

  const roles = Array.isArray(user.roles) ? user.roles : [user.auth];

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
