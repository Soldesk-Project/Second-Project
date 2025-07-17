import React, { useState } from 'react';
import '../../css/findPw.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FindPw = () => {
  const [id, setId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [findPw, setFindPw] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
 
  const handleFindPw = async() => {
    const full = `${emailId}@${emailDomain}`;
    if (!id) {
      alert("아이디를 입력해주세요.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(full)) {
          alert("올바른 이메일 형식을 입력해주세요.");
          return;
    }
    try {
    const res = await axios.post('/api/findPw/checkIdAndEmail', {
      user_id: id,
      user_email: full,
    });
    if (res.data && res.data !== '') {
      setFindPw(res.data);
      setErrorMessage('');
      resetInputs();
    } else {
      setFindPw('');
      setErrorMessage('입력한 정보로 가입된 계정이 없습니다.');
    }
  } catch (err) {
    console.error("PW 찾기 실패:", err);
    setErrorMessage('서버 오류로 PW를 찾을 수 없습니다.');
  }
  };
 
  const handleButtonOption = (e) => {
    const { name } = e.target;
    if (name === 'login') navigate('/');
    else if (name === 'signUp') navigate('/signUp');
    else if (name === 'findId') navigate('/findId');
    else if (name === 'findPw') navigate('/findPw');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFindPw();
    }
  };

  const buttonStyle = {
        width : "100px",
    };

  const moveToLogin = () => {
        navigate(`/`);
    }

  const resetInputs = () => {
        setId('');
        setEmailId('');
        setEmailDomain('');
    }

    return (
    <div className="login-background login-container">
        <img src='images/logo.png' alt='logo' name="login" onClick={handleButtonOption}/>
      <div className="findPw-box">
        <div className='findPw_submit'>
          
          <h1>CotePlay에 어서오세요. </h1>
          <h4>Let's align our constellations!
          문구는 뭐 대애충 아무거나 환영글... </h4><br/>
          <div className="login-options">
            <div className='login-option_1'>
              <button name="signUp" onClick={handleButtonOption}>Sign Up</button>
            </div>
            <div className='login-option_2'>
              <button name="findId" onClick={handleButtonOption}>Find id</button>
              <p>/</p>
              <button name="findPw" onClick={handleButtonOption}>Find password</button>
            </div>
          </div>
          <div className='id_box'>
            <input
                type="text"
                placeholder="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyDown={handleKeyDown}
            />
          </div>
          <div className='email_box'>
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
          {findPw && (<div style={{ color: 'white', marginBottom: '20px' }}>PW : {findPw}</div>)}
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
            <button style={buttonStyle} onClick={moveToLogin}>Home</button>
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