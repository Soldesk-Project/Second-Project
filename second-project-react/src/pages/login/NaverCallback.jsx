import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../store/userSlice';

const NaverCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URL(window.location.href).searchParams;
    const code = urlParams.get("code");
    const returnedState = urlParams.get("state");
    const savedState = localStorage.getItem('naver_oauth_state');

    if (code && returnedState === savedState) {
      axios.post("/api/naver/login", { code, state: returnedState })
        .then(res => {
          const { token, user } = res.data;

          localStorage.setItem("token", token);
          dispatch(setUser(user));
          navigate("/server");
        })
        .catch(err => {
          console.error("네이버 로그인 실패", err);
        });
    }
  }, [dispatch, navigate]);

  return (
    <div>
      네이버 로그인 처리 중...
    </div>
  );
};

export default NaverCallback;
    