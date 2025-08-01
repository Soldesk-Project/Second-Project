import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/loginForm.css';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../store/userSlice';


const LoginForm = () => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.user);

  const KAKAO_CLIENT_ID = "99ddb7e910a924e51b633490da611ead";
  const KAKAO_REDIRECT_URI = "http://localhost:3000/kakao/callback";
  const GOOGLE_CLIENT_ID = "633570415561-hcl7dpl18608021a7lof369flivcklv7.apps.googleusercontent.com";
  const GOOGLE_REDIRECT_URI = "http://localhost:3000/google/callback";

  const handleGoogleLogin = () => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline`;
    window.location.href = url;
  };

  const generateState = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleNaverLogin = () => {
    const state = generateState();
    localStorage.setItem('naver_oauth_state', state); // ✅ 저장해두기

    const NAVER_CLIENT_ID = "NxeIC3yi_Oc0_aO3Ybv6";
    const NAVER_REDIRECT_URI = encodeURIComponent("http://localhost:3000/api/naver/callback");
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}&state=${state}`;

    window.location.href = naverAuthUrl;
  };
  useEffect(() => {
    if (user) {
      // 이미 로그인 상태면 서버 메인 페이지 등으로 이동
      navigate('/server');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // ✅ form 제출 시 기본 동작 방지

    if (!id || !pw) {
      alert('ID와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      localStorage.removeItem('token');

      const res = await axios.post('/api/login', { user_id: id, user_pw: pw });

      localStorage.setItem('token', res.data.token);
      dispatch(setUser(res.data.user));
      navigate('/server');
    } catch (err) {
      if (err.response.status === 409) {
        alert('이미 로그인된 사용자입니다.');
      } else if (err.response.status === 401) {
        alert('아이디 또는 비밀번호가 잘못되었습니다.');
      } else {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const handleKakaoLogin = () => {
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
  }

  const pageRoutes = {
    signUp: '/signUp',
    findId: '/findId',
    findPw: '/findPw',
    login: '/',
  };

  const handleButtonOption = (e) => {
    const route = pageRoutes[e.target.name];
    if (route) navigate(route);
  };

  return (
    <div className="login-background login-container">
        <img src='images/logo.png' alt='logo' name="login" onClick={handleButtonOption}/>
      <div className="login-box">
        <div className='login_submit'>
          
          <h1>CotePlay에 어서오세요. </h1>
          <h6>it 자격증 시험 및 코딩 공부를 쉽게 할 수 있도록 도와주는 교육게임사이트입니다. </h6>
          <div className="login-options">
            <div className='login-option_1'>
              <button name="signUp" onClick={handleButtonOption}>Sign Up</button>
            </div>
            <div className='login-option_2'>
              <button name="findId" onClick={handleButtonOption}>Find id</button>
              <p>/</p>
              <button name="findPw" onClick={handleButtonOption}>Find password</button>
            </div>
          </div>
          <form onSubmit={handleLogin}>
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
            <button type="submit" className='loginButton'>login</button>
          </form>
          <button onClick={handleKakaoLogin} className='kakao-login'>kakao login</button>
          <button onClick={handleNaverLogin} className='naver-login'>naver login</button>
          <button onClick={handleGoogleLogin} className='google-login'>google login</button>
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