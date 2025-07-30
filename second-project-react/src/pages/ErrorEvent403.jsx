import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorEvent403 = () => {
  const nav=useNavigate();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'lightblue'}}>403 - 권한을 찾을 수 없습니다.</h1>
      <p>권한이 존재하지 않아 이동할 수 없습니다.</p>
      <button style={{border: '1px solid lightgray', borderRadius: '5px', width: '200px'}} onClick={() => nav('/')}>홈으로 가기</button>
    </div>
  );
};

export default ErrorEvent403;