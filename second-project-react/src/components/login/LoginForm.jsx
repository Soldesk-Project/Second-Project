import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const KAKAO_CLIENT_ID = "99ddb7e910a924e51b633490da611ead";
  const REDIRECT_URI = "http://localhost:3000/kakao/callback";
  const navigate = useNavigate();

  const handleLogin = () => {
    //임시계정
    if (id === 'admin' && pw === '1234') {
      navigate('/main');
    } else {
      alert('아이디 또는 비밀번호가 틀렸습니다.');
    }
  };

  const handleKakaoLogin = () => {
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  }

  return (
    <div className="login-background login-container">
      <div className="login-box">
        <img src='' alt='로고이미지' className='logoImg'/>
        <h2>로그인</h2>
        <input
          type="text"
          placeholder="아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button onClick={handleLogin}>로그인</button>
        <img src='images/kakao_login_medium_wide.png' alt='카카오 로그인' onClick={handleKakaoLogin}/>
      </div>
    </div>
  );
};

export default LoginForm;