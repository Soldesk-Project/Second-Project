import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/userSlice';

const GoogleCallback = () => {
  const nav = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');

    if (code) {
      axios.post('/api/google/login', { code })
        .then(res => {
          const { token, user, access_token } = res.data;
          localStorage.setItem('token', token);
          dispatch(setUser({ ...user, access_token }));
          nav('/server');
        })
        .catch(err => {
          console.error("구글 로그인 실패", err);
        });
    }
  }, [dispatch, nav]);

  return <div>구글 로그인 처리 중...</div>;
};

export default GoogleCallback;
