import React, { useCallback, useState } from 'react';
import '../../css/findPw.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FindPw = () => {
  const [id, setId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
 
  const fullEmail = `${emailId}@${emailDomain}`;

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!id) {
      alert('아이디를 입력해주세요.');
      return false;
    }
    if (!emailRegex.test(fullEmail)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleFindPw = useCallback(async () => {
    if (!validateInputs()) return;

    try {
      const { data } = await axios.post('/api/findPw/checkIdAndEmail', {
        user_id: id,
        user_email: fullEmail,
      });

      if (data.success) {
        alert('입력한 이메일 주소로 임시 비밀번호가 발송되었습니다.');
        setErrorMessage('');
        resetInputs();
      } else {
        setErrorMessage(data.message || '입력한 정보로 가입된 계정이 없습니다.');
      }
    } catch (error) {
      console.error('PW 찾기 실패:', error);
      setErrorMessage('서버 오류로 PW를 찾을 수 없습니다.');
    }
  }, [id, emailId, emailDomain]);
 
  const handleNavigation = (e) => {
    const { name } = e.target;
    const paths = {
      login: '/',
      signUp: '/signUp',
      findId: '/findId',
      findPw: '/findPw',
    };
    navigate(paths[name]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFindPw();
    }
  };

  const buttonStyle = {
        width : "100px",
    };

  const resetInputs = () => {
        setId('');
        setEmailId('');
        setEmailDomain('');
    }

    return (
    <div className="login-background login-container">
        <img 
          src='images/logo.png'
          alt='logo'
          name="login"
          onClick={handleNavigation}
          style={{ cursor: 'pointer' }}
        />
      <div className="findPw-box">
        <div className='findPw_submit'>
          <h1>CotePlay에 어서오세요.</h1>
          <br />
          <div className="login-options">
            <div className='login-option_1'>
              <button name="signUp" onClick={handleNavigation}>Sign Up</button>
            </div>
            <div className='login-option_2'>
              <button name="findId" onClick={handleNavigation}>Find id</button>
              <p>/</p>
              <button name="findPw" onClick={handleNavigation}>Find password</button>
            </div>
          </div>

          <div className='id_box'>
            <input
                type="text"
                placeholder="아이디를 입력하세요."
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyDown={handleKeyDown}
            />
          </div>

          <div className='email_box'>
            <input
              type="text"
              placeholder="이메일 아이디"
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
              placeholder="선택 또는 입력"
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

          {errorMessage && (<div style={{ color: 'lightcoral', marginBottom: '20px' }}>{errorMessage}</div>)}

          <div className='signUpBtn'
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '1rem 0',
                    }}>
            <button style={buttonStyle} onClick={handleFindPw}>Find Result</button>
            <button style={buttonStyle} onClick={resetInputs}>Reset</button>
            <button style={buttonStyle} onClick={() => navigate('/')}>Home</button>
          </div>
        </div>

        <div className='login-image'>
          <img 
            src='images/loginpage_image.png'
            alt='로그인화면 이미지'
            />
        </div>
      </div>
    </div>
    );
};

export default FindPw;