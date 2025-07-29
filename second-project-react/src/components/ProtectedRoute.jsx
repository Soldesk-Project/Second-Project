import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const user = useSelector(state => state.user);

  console.log(user);
  
  if (!user || !user.auth) {
    return <Navigate to="/" replace />;
  }

  // 문자열 권한을 배열로 변환
  const roles = Array.isArray(user.roles) ? user.roles : [user.auth];

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
