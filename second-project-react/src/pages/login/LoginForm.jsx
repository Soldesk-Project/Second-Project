import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/loginForm.css';
import axios from 'axios';

const LoginForm = () => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const navigate = useNavigate();
  
  const KAKAO_CLIENT_ID = "99ddb7e910a924e51b633490da611ead";
  const REDIRECT_URI = "http://localhost:3000/kakao/callback";

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/login', {
        user_id: id,
        user_pw: pw,
      },{
        withCredentials: true
      });

      alert('로그인 성공');
      navigate('/server', { state: { userId: id } });
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('아이디 또는 비밀번호가 틀렸습니다.');
    }
  };

  const handleKakaoLogin = () => {
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  }

  const handleButtonOption = (e) => {
    const { name } = e.target;
    switch (name) {
      case 'signUp':
        navigate('/signUp');
        break;
      case 'findId':
        navigate('/findId');
        break;
      case 'findPw':
        navigate('/findPw');
        break;
      default:
        break;
    }
  };

  return (
    <div className="login-background login-container">
      <div className="login-box">
        <img src='/images/logo.png' alt='로고이미지' className='logo-img'/>
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
        <img 
          src='images/kakao_login_medium_wide.png' 
          className='kakao-login' 
          alt='카카오 로그인' 
          onClick={handleKakaoLogin}
        />
        <div className="login-options">
            <button name="signUp" onClick={handleButtonOption}>회원가입</button>
            <button name="findId" onClick={handleButtonOption}>아이디찾기</button>
            <button name="findPw" onClick={handleButtonOption}>비밀번호찾기</button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;