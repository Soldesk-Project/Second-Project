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
        <img src='images/logo.png' alt='logo'/>
      <div className="login-box">
        <div className='login_submit'>
          
          <h1>CotePlay에 어서오세요. </h1>
          <h4>Let's align our constellations!
          문구는 뭐 대애충 아무거나 환영글... </h4><br/>
          <div className="login-options">
            <div className='login-option_1'>
              <button name="signUp" onClick={handleButtonOption}>Join</button>
            </div>
            <div className='login-option_2'>
              <button name="findId" onClick={handleButtonOption}>Find id</button>
              <p>/</p>
              <button name="findPw" onClick={handleButtonOption}>Find password</button>
            </div>
          </div>
          <input
            type="text"
            placeholder="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button onClick={handleLogin} className='loginButton'>login</button>
          <button onClick={handleKakaoLogin} className='kakao-login'>kakao login</button>
        </div>
        <div className='login-image'>
          <img 
            src='images/loginpage_image.png'
            alt='로그인화면 이미지'
            />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;