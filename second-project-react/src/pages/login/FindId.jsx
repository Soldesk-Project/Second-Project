import React, { useState } from 'react';
import '../../css/findId.css';
import { useNavigate } from 'react-router-dom';

export default function FindId() {
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const full = `${emailId}@${emailDomain}`;
    if (full === 'admin@naver.com') {
      navigate('/server', { state: { userEmail: full } });
    } else {
      alert('이메일로 확인된 아이디가 없습니다');
    }
  };

  const handleButtonOption = (e) => {
    const { name } = e.target;
    if (name === 'login') navigate('/');
    else if (name === 'signUp') navigate('/signUp');
    else if (name === 'findId') navigate('/findId');
    else if (name === 'findPw') navigate('/findPw');
  };

  return (
    <div className="login-background login-container">
      <img
        src="images/logo.png"
        alt="logo"
        name="login"
        onClick={handleButtonOption}
      />
      <div className="findId-box">
        <div className="findId_submit">
          <h1>CotePlay에 어서오세요.</h1>
          <h4>Let's align our constellations!</h4>
          <div className="login-options">
            <div className="login-option_1">
              <button name="signUp" onClick={handleButtonOption}>Join</button>
            </div>
            <div className="login-option_2">
              <button name="findId" onClick={handleButtonOption}>Find id</button>
              <span>/</span>
              <button name="findPw" onClick={handleButtonOption}>Find password</button>
            </div>
          </div>

          <div className="email_box">
            <input
              type="text"
              placeholder="이메일을 입력하세요."
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              style={{ width: '45%' }}
            />
            <div
              style={{
                width: '10%',
                height: '31px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              @
            </div>
            <input
              list="email-domains"
              placeholder="직접 입력"
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value)}
              style={{ width: '45%' }}
            />
            <datalist id="email-domains">
              <option value="naver.com" />
              <option value="gmail.com" />
              <option value="hanmail.net" />
            </datalist>
          </div>

          <button onClick={handleLogin} className="findIdButton">
            Find Result
          </button>
        </div>
        <div className="login-image">
          <img
            src="images/loginpage_image.png"
            alt="로그인 화면 이미지"
          />
        </div>
      </div>
    </div>
  );
}
