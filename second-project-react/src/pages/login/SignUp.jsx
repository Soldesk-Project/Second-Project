import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/signUp.css';
import axios from 'axios';

const SignUp = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState({
        user_nick : '',
        user_id : '',
        user_pw : '',
        user_email : '',
    });

    const [emailId, setEmailId] = useState('');
    const [emailDomain, setEmailDomain] = useState('');

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setUsers({
            ...users,
            [name] : value
        });
    }

    const handleEmailChange = (e) => {
        setEmailId(e.target.value);
    };

    const handleDomainChange = (e) => {
        const domain = e.target.value;
        setEmailDomain(domain);
        updateEmail(emailId, domain);
    };

    const updateEmail = (id, domain) => {
        const fullEmail = domain ? `${id}@${domain}` : id;
        setUsers((prev) => ({ ...prev, user_email: fullEmail }));
    };

    const resetInputs = () => {
        setUsers({
            user_nick : '',
            user_id : '',
            user_pw : '',
            user_email : '',
        });
        setEmailId('');
        setEmailDomain('');
    }

    const registerUser = async () => {
        const resp = await axios.post('/api/signUp', users);
        if(resp.status === 200){
            alert('회원가입 성공');
            navigate('/');
        }else{
            new Error('데이터 실패...');
        }
        console.log(users);
    }

    const moveToLogin = () => {
        navigate(`/`);
    }

    const buttonStyle = {
        width : "100px",
    };

    return (
        <div className="login-background login-container">
<<<<<<< HEAD
                <img src='/images/logo.png' alt='로고이미지' onClick={moveToLogin}/>
            <div className="signUp-box">
                <div className='signUp_submit'>

                    <h1>CotePlay에 어서오세요. </h1>
                    <h4>Let's align our constellations!
                    문구는 뭐 대애충 아무거나 환영글... </h4><br/>
=======
            <div className="login-box">
                <img src='/images/logo.png' alt='로고이미지' className='logo-img'/>
                <input
                    type="text"
                    name='user_nick'
                    placeholder="닉네임을 입력하세요."
                    value={users.user_nick}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name='user_id'
                    placeholder="아이디을 입력하세요."
                    value={users.user_id}
                    onChange={handleInputChange}
                />
                <input
                    type="password"
                    name='user_pw'
                    placeholder="비밀번호을 입력하세요."
                    value={users.user_pw}
                    onChange={handleInputChange}
                />
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: '5px',
                    marginBottom: '1rem'
                }}>
>>>>>>> 3959660d8d073ab8451a120da3da054e503331e7
                    <input
                        type="text"
                        name='nickName'
                        placeholder="닉네임을 입력하세요."
                        value={users.nickName}
                        onChange={handleInputChange}
                    />
                    <input
                        type="text"
                        name='id'
                        placeholder="아이디을 입력하세요."
                        value={users.id}
                        onChange={handleInputChange}
                    />
                    <input
                        type="password"
                        name='pw'
                        placeholder="비밀번호을 입력하세요."
                        value={users.pw}
                        onChange={handleInputChange}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '5px'
                    }}>
                        <input
                            type="text"
                            placeholder="이메일을 입력하세요."
                            value={emailId}
                            onChange={handleEmailChange}
                            style={{width:'45%'}}
                        />
                        <div style={{
                            width: '10%',
                            height: '31px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>@</div>
                        <input
                            list="email-domains"
                            placeholder="직접 입력"
                            value={emailDomain}
                            onChange={handleDomainChange}
                            style={{ width: '45%'}}
                        />
                        <datalist id="email-domains">
                            <option value="naver.com" />
                            <option value="gmail.com" />
                            <option value="hanmail.net" />
                        </datalist>
                    </div>

                    <div className='signUpBtn'
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '1rem 0',
                    }}>
                        <button style={buttonStyle} onClick={registerUser}>Join</button>
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

export default SignUp;