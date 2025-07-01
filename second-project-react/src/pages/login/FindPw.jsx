import React, { useState } from 'react';
import '../../css/findPw.css';
import { useNavigate } from 'react-router-dom';

const FindPw = () => {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    //임시계정
    if (id === 'admin' && email === 'admin' && domain === 'naver.com') {
      navigate('/server', { state: { userEmail: email } });
    } else {
      alert('아이디와 이메일로 확인된 비밀번호가 없습니다');
    }
  };

  const handleButtonOption = (e) => {
    const { name } = e.target;
    switch (name) {
      case 'signUp':
        navigate('/signUp');
        break;
      case 'findId':
        navigate('/findId');
        break;
      case 'findPw':
        navigate('/findPw');
        break;
      case 'login':
        navigate('/');
        break;
      default:
        break;
    }
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
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <p>@</p>
            <select className='domain_box'>
                <option>naver.com</option>
                <option>gmail.com</option>
                <option>apple.com</option>
                <option>daum.com</option>
                <option>hanmail.com</option>
                <option>직접입력</option>
            </select>
          </div>
          <button onClick={handleLogin} className='findPwButton'>Find Result</button>

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