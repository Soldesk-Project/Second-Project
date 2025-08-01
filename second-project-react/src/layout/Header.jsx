import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('');
  const location = useLocation();
  const nav = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');

    if (page === 'itemBook') setActiveTab('도감');
    else if (page === 'achievements') setActiveTab('업적');
    else if (location.pathname.includes('/shop')) setActiveTab('상점');
    else if (location.pathname.includes('/inquiries')) setActiveTab('고객센터');
    else setActiveTab('문제풀이');
  }, [location]);

  const isKakaoUser = () => user.user_id.startsWith('kakao_');
  const isNaverUser = () => user.user_id.startsWith('naver_');
  const isGoogleUser = () => user.user_id.startsWith('google_');

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

  const logoutNaver = async () => {
    try {
      // 1. access_token 삭제
      await axios.post('/api/naver/logout', {
        accessToken: user.access_token,
      });

      // 2. 네이버 세션 로그아웃 요청을 숨겨서 보냄 (iframe 등)
      const logoutWin = window.open(
        'https://nid.naver.com/nidlogin.logout',
        '_blank',
        'width=1,height=1,left=-1000,top=-1000'
      );

      setTimeout(() => {
        if (logoutWin) logoutWin.close();
        // 3. 클라이언트 상태 초기화
        dispatch(clearUser());
        dispatch(clearServer());
        localStorage.clear();
        nav('/'); // 또는 window.location.href = '/'
      }, 1000); // 약간의 시간 여유
    } catch (err) {
      console.error('네이버 로그아웃 실패:', err);
    }
  };

  const logoutGoogle = async () => {
    try {
      // 1. 서버 측 로그아웃 처리 (옵션)
      await axios.post('/api/google/logout', {
        accessToken: user.access_token, // 서버에서 토큰 무효화 처리
      });

      // 2. 구글 로그아웃 URL 호출 (iframe으로)
      const iframe = document.createElement('iframe');
      iframe.src = 'https://accounts.google.com/Logout';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // 3. 약간의 시간 기다린 후 클라이언트 상태 초기화
      setTimeout(() => {
        dispatch(clearUser());
        dispatch(clearServer());
        localStorage.clear();
        nav('/');
      }, 1000);
    } catch (err) {
      console.error('구글 로그아웃 실패:', err);
    }
  };

  const logOut = async () => {
    try {
      if (user.user_id) {
        await axios.post('/api/logout', { userId: user.user_id });
      }

      if (isKakaoUser()) {
        await logoutKakao();
        return;
      }

      if (isNaverUser()) {
        await logoutNaver();
        return;
      }

      if (isGoogleUser()) {
      await logoutGoogle();
      return;
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
        <div className='logo-container'>
          <img
            src="/images/logo.png"
            alt="로고"
            onClick={clickToGoMain}
            className='logo-img header-logo'
          />
        </div>
        
        <ul className='header-category'>
          <li><span className={activeTab === '문제풀이' ? 'active' : ''} onClick={() => {setActiveTab('문제풀이'); clickToGoMain();}}>문제풀이</span></li>
          <li><span data-name="itemBook" className={activeTab === '도감' ? 'active' : ''} onClick={(e) => {setActiveTab('도감'); clickToGo(e)}}>도감</span></li>
          <li><span data-name="achievements" className={activeTab === '업적' ? 'active' : ''} onClick={(e) => {setActiveTab('업적'); clickToGo(e)}}>업적</span></li>
          <li><span data-name="shop" className={activeTab === '상점' ? 'active' : ''} onClick={(e) => {setActiveTab('상점'); clickToGo(e)}}>상점</span></li>
          <li><span data-name="inquiries" className={activeTab === '고객센터' ? 'active' : ''} onClick={(e) => {setActiveTab('고객센터'); clickToGo(e)}}>고객센터</span></li>
          {
            user.auth==='ROLE_ADMIN' &&
            <li><span data-name="admin" className={activeTab === '관리자 페이지' ? 'active' : ''} onClick={(e) => {setActiveTab('관리자 페이지'); clickToGo(e)}}>관리자 페이지</span></li>
          }
        </ul>
      </div>
      <div className='header-box-right'>
        <img onClick={serverOut} className='header-enter' src="/images/SelectChannel.png" alt="서버이동" />
        <img onClick={logOut} className='header-signout' src="/images/Logout.png" alt="나가기" />
      </div>
    </div>
  );
};

export default Header;
