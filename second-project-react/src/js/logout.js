// util/logout.js
import axios from 'axios';

// Kakao API 키
const KAKAO_JS_KEY = 'f95efd6df49141c0b98c0463ecfe5d9e';
const KAKAO_CLIENT_ID = '99ddb7e910a924e51b633490da611ead';
const LOGOUT_REDIRECT_URI = 'http://localhost:3000';

export const createLogoutHandler = ({
  dispatch,
  clearUser,
  clearServer,
  nav,
  sendLeaveMessage,
  user,
}) => {

  const isKakaoUser = () => user.user_id?.startsWith('kakao_');
  const isNaverUser = () => user.user_id?.startsWith('naver_');
  const isGoogleUser = () => user.user_id?.startsWith('google_');

  /** 🔸 카카오 로그아웃 */
  const logoutKakao = async () => {
    if (!window.Kakao) return;

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }

    const kakaoAccessToken = window.Kakao.Auth.getAccessToken();
    if (kakaoAccessToken) {
      await axios.post('/api/kakao/logout', { accessToken: kakaoAccessToken });
    }

    await new Promise(res => {
      window.Kakao.Auth.logout(() => res());
    });

    const logoutUrl =
      `https://kauth.kakao.com/oauth/logout?client_id=${KAKAO_CLIENT_ID}&logout_redirect_uri=${encodeURIComponent(LOGOUT_REDIRECT_URI)}`;

    window.location.href = logoutUrl;
  };

  /** 🔸 네이버 로그아웃 */
  const logoutNaver = async () => {
    await axios.post('/api/naver/logout', {
      accessToken: user.access_token,
    });

    const win = window.open(
      'https://nid.naver.com/nidlogin.logout',
      '_blank',
      'width=1,height=1,left=-1000,top=-1000'
    );

    setTimeout(() => win?.close(), 1000);
  };

  /** 🔸 구글 로그아웃 */
  const logoutGoogle = async () => {
    await axios.post('/api/google/logout', {
      accessToken: user.access_token,
    });

    const iframe = document.createElement('iframe');
    iframe.src = 'https://accounts.google.com/Logout';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  };

  /** 🔥 최종 로그아웃 함수 (클라이언트/서버 정리 포함) */
  const logOut = async () => {
    try {
      if (isKakaoUser()) return await logoutKakao();
      if (isNaverUser()) return await logoutNaver();
      if (isGoogleUser()) return await logoutGoogle();

      // 일반 유저 로그아웃
      if (user.user_id) {
        await axios.post('/api/logout', { userId: user.user_id });
      }

    } catch (err) {
      console.error('로그아웃 오류:', err);

    } finally {
      dispatch(clearUser());
      dispatch(clearServer());
      localStorage.clear();
      sendLeaveMessage?.();
      nav('/');
    }
  };

  return logOut;
};
