import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState({
        nickName : '',
        id : '',
        pw : '',
        email : '',
    })

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setUsers({
            ...users,
            [name] : value
        });
    }

    const [emailId, setEmailId] = useState('');
    const [emailDomain, setEmailDomain] = useState('');

    const handleEmailChange = (e) => {
        setEmailId(e.target.value);
    };

    const handleEmailBlur = () => {
        if (emailDomain) {
            setUsers(prev => ({
                ...prev,
                email: `${emailId}@${emailDomain}`
            }));
        } else {
            setUsers(prev => ({
                ...prev,
                email: emailId
            }));
        }
    };

    const resetInputs = () => {
        setUsers({
            nickName : '',
            id : '',
            pw : '',
            email : '',
        });
        setEmailId('');
        setEmailDomain('');
    }

    const registerUser = () => {
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
            <div className="login-box">
                <img src='/images/logo.png' alt='로고이미지' className='logoImg' style={{width: '100px', display: 'block', margin: '0 auto'}}/>
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
                type="text"
                name='pw'
                placeholder="비밀번호을 입력하세요."
                value={users.pw}
                onChange={handleInputChange}
                />
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', gap: '5px',
                    marginBottom: '1rem'}}>
                    <input
                    type="text"
                    name='email'
                    placeholder="이메일을 입력하세요."
                    value={emailId}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
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
                    onChange={(e) => {
                        const domain = e.target.value;
                        setEmailDomain(domain);
                        setUsers((prev) => ({
                        ...prev,
                        email: domain ? `${emailId}@${domain}` : emailId
                        }));
                    }}
                    style={{ width: '45%', height: '36px' }}
                    />

                    <datalist id="email-domains">
                        <option value="naver.com" />
                        <option value="gmail.com" />
                        <option value="hanmail.net" />
                    </datalist>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem 0'}}>
                    <button style={buttonStyle} onClick={registerUser}>등록</button>
                    <button style={buttonStyle} onClick={resetInputs}>다시 입력</button>
                    <button style={buttonStyle} onClick={moveToLogin}>돌아가기</button>
                </div>
            </div>
        </div>
    );
};

export default SignUp;