import React, { useState } from 'react';
import '../../css/findPw.css';
import { useNavigate } from 'react-router-dom';

const FindPw = () => {
  const [id, setId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const navigate = useNavigate();
 
  const handleFind = () => {
    // 예: id와 email이 둘 다 있어야 동작
    if (id === 'admin' && emailId === 'admin@naver.com') {
      navigate('/reset-password');
    } else {
      alert('일치하는 계정이 없습니다.');
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
        <img src='images/logo.png' alt='logo' name="login" onClick={handleButtonOption}/>
      <div className="findPw-box">
        <div className='findPw_submit'>
          
          <h1>CotePlay에 어서오세요. </h1>
          <h4>Let's align our constellations!
          문구는 뭐 대애충 아무거나 환영글... </h4><br/>
          <div className="login-options">
            <div className='login-option_1'>
              <button name="signUp" onClick={handleButtonOption}>Join</button>
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
            />
          </div>
          <div className='email_box'>
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
          <button onClick={handleFind} className='findPwButton'>Find Result</button>

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