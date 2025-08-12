import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../store/userSlice';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");
    
    if(code){
      axios.post("/api/kakao/login", {code})
        .then(res => {
          const { token, user } = res.data;

           // ✅ 토큰 저장
          localStorage.setItem("token", token);

          // ✅ Redux에 유저 상태 저장
          dispatch(setUser(user));

          // ✅ 페이지 이동
          navigate("/server");
           
        })
        .catch(err => {
        })
    }
  }, [dispatch, navigate]);
  return (
    <div>
      카카오 로그인 처리 중...
    </div>  
  );
};

export default KakaoCallback;