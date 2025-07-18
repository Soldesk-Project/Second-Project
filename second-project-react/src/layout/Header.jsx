import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/header.css';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser, clearServer } from '../store/userSlice';
import axios from 'axios';

const KAKAO_JS_KEY = 'f95efd6df49141c0b98c0463ecfe5d9e';
const KAKAO_CLIENT_ID = '99ddb7e910a924e51b633490da611ead';
const LOGOUT_REDIRECT_URI = 'http://localhost:3000';

const Header = () => {
  const server = useSelector(state => state.user.server);
  const user = useSelector(state => state.user.user);
  const nav = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
  }, []);

  const isKakaoUser = () => user.user_id.startsWith('kakao_');

  const clickToGoMain = () => nav(`/main/${server}`);

  const clickToGo = e => {
    const name = e.target.dataset.name;
    if (name === 'itemBook' || name === 'achievements') {
      nav(`/main/${server}?page=${name}`);
    } else {
      nav(`/${name}`);
    }
  };

  const serverOut = () => {
    dispatch(clearServer());
    nav('/server');
  };

  const logoutKakao = async () => {
    if (!window.Kakao) {
      console.warn('카카오 SDK가 로드되지 않았습니다.');
      return;
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }

    const kakaoAccessToken = window.Kakao.Auth.getAccessToken();
    if (kakaoAccessToken) {
      await axios.post('/api/kakao/logout', { accessToken: kakaoAccessToken });
    }

    // 카카오 SDK 세션 로그아웃
    await new Promise(resolve => {
      window.Kakao.Auth.logout(() => resolve());
    });

    // 카카오 계정 로그아웃 페이지로 리다이렉트
    const logoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${KAKAO_CLIENT_ID}&logout_redirect_uri=${encodeURIComponent(LOGOUT_REDIRECT_URI)}`;
    window.location.href = logoutUrl;
  };

  const logOut = async () => {
    try {
      if (user.user_id) {
        await axios.post('/api/logout', { userId: user.user_id });
      }

      if (isKakaoUser()) {
        await logoutKakao();
        return; // 리다이렉트 하므로 함수 종료
      }
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
    } finally {
      // 일반 사용자 로그아웃 및 공통 처리
      dispatch(clearUser());
      dispatch(clearServer());
      localStorage.clear();
      nav('/');
    }
  };

  return (
    <div className='header'>
      <div className='header-box-left'>
        <ul className='header-category'>
          <li>
            <div>
              <img
                src="/images/logo.png"
                alt="로고"
                onClick={clickToGoMain}
                className='logo-img header-logo'
              />
            </div>
          </li>
          <li><span onClick={clickToGoMain}>문제풀이</span></li>
          <li><span data-name="itemBook" onClick={clickToGo}>도감</span></li>
          <li><span data-name="achievements" onClick={clickToGo}>업적</span></li>
          <li><span data-name="shop" onClick={clickToGo}>상점</span></li>
          <li><span data-name="inquiries" onClick={clickToGo}>고객센터</span></li>
        </ul>
      </div>
      <div className='header-box-right'>
        <img onClick={serverOut} className='header-enter' src="/images/door-open.png" alt="서버이동" />
        <img onClick={logOut} className='header-signout' src="/images/signout.png" alt="나가기" />
      </div>
    </div>
  );
};

export default Header;
