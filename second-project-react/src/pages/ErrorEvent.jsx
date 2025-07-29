import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorEvent = () => {
  const nav=useNavigate();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'lightblue'}}>404 - 페이지를 찾을 수 없습니다.</h1>
      <p>요청하신 페이지가 존재하지 않습니다.</p>
      <button style={{border: '1px solid lightgray', borderRadius: '5px', width: '200px'}} onClick={() => nav('/')}>홈으로 가기</button>
    </div>
  );
};

export default ErrorEvent;