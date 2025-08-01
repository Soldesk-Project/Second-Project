import React, { useState } from 'react';
import '../../css/findId.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FindId() {
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [findId, setFindId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleFindId = async() => {
    if (!emailId.trim() || !emailDomain.trim()) {
      alert("이메일 ID와 도메인을 모두 입력해주세요.");
      return;
    }
    const full = `${emailId}@${emailDomain}`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(full)) {
          alert("올바른 이메일 형식을 입력해주세요.");
          return;
    }
    try {
    const res = await axios.get(`/api/findId/checkEmail?user_email=${full}`);
    if (res.status === 200 && res.data) {
      setFindId(res.data);
      setErrorMessage('');
      resetInputs();
    } else {
      setFindId('');
      setErrorMessage('입력한 이메일로 가입된 계정이 없습니다.');
    }
    } catch (err) {
      console.error("ID 찾기 실패:", err);
      if (err.response.status === 400) {
        setErrorMessage('잘못된 요청입니다. 이메일 형식을 확인해주세요.');
      } else if (err.response.status === 404) {
        setErrorMessage('입력한 이메일로 가입된 계정이 없습니다.');
      } else {
        setErrorMessage('서버 오류로 ID를 찾을 수 없습니다.');
      }
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(findId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 후 메시지 숨김
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
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
          <div className="login-options">
            <div className='login-option_1'>
              <button name="signUp" onClick={handleButtonOption}>회원가입</button>
            </div>
            <div className='login-option_2'>
              <button name="findId" onClick={handleButtonOption}>아이디 찾기</button>
              <p>/</p>
              <button name="findPw" onClick={handleButtonOption}>비밀번호 찾기</button>
            </div>
          </div>

          <div className="email_box" style={{marginBottom:'0px'}}>
            <input
              type="text"
              placeholder="이메일 입력"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '45%' }}
            />
            <div
              style={{
                width: '10%',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
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
          {/* {findId && (<div style={{ color: 'white', marginBottom: '20px' }}>ID : {findId}</div>)} */}
          {findId && (
            <div style={{ color: 'white', marginBottom: '20px' }}>
              ID : <strong>{findId}</strong>
              <button
                onClick={copyToClipboard}
                style={{
                  marginLeft: '10px',
                  padding: '4px 10px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  backgroundImage: `url('/images/Submit.png')`,
                  borderRadius: '4px'
                }}
              >
                복사
              </button>
              {copied && (
                <span style={{ marginLeft: '10px', color: 'lightgreen' }}>
                  복사되었습니다!
                </span>
              )}
            </div>
          )}
          {errorMessage && (<div style={{ color: 'lightcoral', marginBottom: '20px' }}>{errorMessage}</div>)}
          <div className='signUpBtn'
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '1rem 0',
                    }}>
            <button style={buttonStyle} onClick={handleFindId}>찾기</button>
            <button style={buttonStyle} onClick={resetInputs}>다시 입력</button>
            <button style={buttonStyle} onClick={moveToLogin}>홈</button>
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
