import React, { useState } from 'react';
import '../../css/findId.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FindId() {
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [findId, setFindId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleFindId = async() => {
    const full = `${emailId}@${emailDomain}`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(full)) {
          alert("올바른 이메일 형식을 입력해주세요.");
          return;
    }
    try {
    const res = await axios.get(`/api/findId/checkEmail?user_email=${full}`);
    if (res.data && res.data !== '') {
      setFindId(res.data);
      setErrorMessage('');
      resetInputs();
    } else {
      setFindId('');
      setErrorMessage('입력한 이메일로 가입된 계정이 없습니다.');
    }
  } catch (err) {
    console.error("ID 찾기 실패:", err);
    setErrorMessage('서버 오류로 ID를 찾을 수 없습니다.');
  }
  };

  const resetInputs = () => {
        setEmailId('');
        setEmailDomain('');
    }

  const handleButtonOption = (e) => {
    const { name } = e.target;
    if (name === 'login') navigate('/');
    else if (name === 'signUp') navigate('/signUp');
    else if (name === 'findId') navigate('/findId');
    else if (name === 'findPw') navigate('/findPw');
  };

  const moveToLogin = () => {
        navigate(`/`);
    }

  const buttonStyle = {
        width : "100px",
    };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFindId();
    }
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
              <button name="signUp" onClick={handleButtonOption}>Sign Up</button>
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
              style={{ width: '45%' }}
            />
            <datalist id="email-domains">
              <option value="naver.com" />
              <option value="gmail.com" />
              <option value="hanmail.net" />
            </datalist>
          </div>
          {findId && (<div style={{ color: 'white', marginBottom: '20px' }}>ID : {findId}</div>)}
          {errorMessage && (<div style={{ color: 'lightcoral', marginBottom: '20px' }}>{errorMessage}</div>)}
          <div className='signUpBtn'
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '1rem 0',
                    }}>
            <button style={buttonStyle} onClick={handleFindId}>Find Result</button>
            <button style={buttonStyle} onClick={resetInputs}>Reset</button>
            <button style={buttonStyle} onClick={moveToLogin}>Home</button>
          </div>
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
