import axios from 'axios';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const KakaoCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");
    if(code){
      axios.post("http://localhost:9099/api/kakao/login", {code})
        .then(res => {
          console.log(res.data);
          navigate("/server");
           
        })
        .catch(err => {
          console.log("로그인 실패", err);
        })
    }
  }, []);
  return (
    <div>
      카카오 로그인 처리 중...
    </div>  
  );
};

export default KakaoCallback;