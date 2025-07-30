import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import '../../css/signUp.css';
import axios from 'axios';

const SignUp = () => {
    const navigate = useNavigate();
    const [pwConfirm, setPwConfirm] = useState('');

    const nickRef = useRef(null);
    const idRef = useRef(null);
    const pwConfirmRef = useRef(null);
    const emailIdRef = useRef(null);

    const [users, setUsers] = useState({
        user_nick : '',
        user_id : '',
        user_pw : '',
        user_email : '',
    });
    const [isDuplicateId, setIsDuplicateId] = useState(null);
    const [isDuplicateNick, setIsDuplicateNick] = useState(null);
    const [isDuplicateEmail, setIsDuplicateEmail] = useState(null);
    const [lastCheckedId, setLastCheckedId] = useState('');
    const [lastCheckedNickname, setLastCheckedNickname] = useState('');
    const [lastCheckedEmail, setLastCheckedEmail] = useState('');

    const [emailId, setEmailId] = useState('');
    const [emailDomain, setEmailDomain] = useState('');

    const handleInputChange = (e) => {
        const {name, value} = e.target;

        if (name === 'user_id') {
            const regex = /^[a-zA-Z0-9]*$/; // 영어 + 숫자만 허용
            if (!regex.test(value)) return; // 정규식에 맞지 않으면 입력 무시

            if (value.length > 20) return; // 최대 길이 제한

            // 값이 비어있거나 최소 길이 미달이면 그냥 저장만 (표시 X)
            setUsers({
                ...users,
                [name]: value
            });
            return;
        }

        if (name === 'pwConfirm') {
            setPwConfirm(value);
            return;
        }

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
        setPwConfirm('');
    }

    const registerUser = async () => {
        const { user_nick, user_id, user_pw, user_email } = users;

        if (!user_nick || !user_id || !user_pw || !user_email) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        if (user_id !== lastCheckedId) {
            alert('아이디 중복 확인 중입니다. 잠시만 기다려주세요.');
            return;
        }
        if (isDuplicateId === true) {
            alert("이미 사용 중인 아이디입니다.");
            idRef.current.focus();
            return;
        }
        if (user_nick !== lastCheckedNickname) {
            alert('닉네임 중복 확인 중입니다. 잠시만 기다려주세요.');
            return;
        }
        if (isDuplicateNick === true) {
            alert("이미 사용 중인 닉네임입니다.");
            nickRef.current.focus();
            return;
        }
        if (user_pw !== pwConfirm) {
            alert("비밀번호가 일치하지 않습니다.");
            pwConfirmRef.current.focus();
            return;
        }
        if (user_email !== lastCheckedEmail) {
            alert('이메일 중복 확인 중입니다. 잠시만 기다려주세요.');
            return;
        }
        if (isDuplicateEmail === true) {
            alert("이미 사용 중인 이메일입니다.");
            emailIdRef.current.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email)) {
            alert("올바른 이메일 형식을 입력해주세요.");
            return;
        }

        try {
            const resp = await axios.post('/api/signUp', users);
            if (resp.status === 200) {
                alert('회원가입 성공');
                navigate('/');
            } else {
                alert('회원가입 실패');
            }
        } catch (error) {
            console.error("회원가입 오류:", error);
            alert("서버 오류가 발생했습니다.");
        }
    }

    const checkDuplicateId = useCallback(
        debounce(async (userId) => {
            try {
            const res = await axios.get(`/api/signUp/checkId?user_id=${userId}`);
            setIsDuplicateId(res.data.duplicate);
            setLastCheckedId(userId);
            } catch (err) {
            console.error("중복 확인 실패:", err);
            }
    }, 500), []);

    useEffect(() => {
        if (users.user_id.trim() !== '' && users.user_id.length >= 4) {
            checkDuplicateId(users.user_id);
        } else {
            setIsDuplicateId(null); // 메시지 감춤
        }
    }, [users.user_id]);

    const checkDuplicateNick = useCallback(
        debounce(async (userNick) => {
            try {
            const res = await axios.get(`/api/signUp/checkNick?user_nick=${userNick}`);
            setIsDuplicateNick(res.data.duplicate);
            setLastCheckedNickname(userNick);
            } catch (err) {
            console.error("중복 확인 실패:", err);
            }
    }, 500), []);

    useEffect(() => {
        if (users.user_nick.trim() !== '') {
            checkDuplicateNick(users.user_nick);
        }
    }, [users.user_nick]);

    const checkDuplicateEmail = useCallback(
        debounce(async (userEmail) => {
            try {
            const res = await axios.get(`/api/signUp/checkEmail?user_email=${userEmail}`);
            setIsDuplicateEmail(res.data.duplicate);
            setLastCheckedEmail(userEmail);
            } catch (err) {
            console.error("중복 확인 실패:", err);
            }
    }, 500), []);

    useEffect(() => {
        const fullEmail = emailDomain ? `${emailId}@${emailDomain}` : emailId;
        setUsers((prev) => ({ ...prev, user_email: fullEmail }));

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(fullEmail)) {
            checkDuplicateEmail(fullEmail);
        } else {
            setIsDuplicateEmail(null);
        }
    }, [emailId, emailDomain]);

    const moveToLogin = () => {
        navigate(`/`);
    }

    const buttonStyle = {
        width : "100px",
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
        registerUser();
        }
    };

    return (
        <div className="login-background login-container">
                <img src='/images/logo.png' alt='로고이미지' onClick={moveToLogin}/>
            <div className="signUp-box">
                <div className='signUp_submit'>

                    <h1>CotePlay에 어서오세요. </h1><br/>
                    <input
                        type="text"
                        name='user_nick'
                        placeholder="닉네임을 입력하세요."
                        value={users.user_nick}
                        ref={nickRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    {users.user_nick && isDuplicateNick === true && (<p style={{ color: 'red' }}>이미 사용 중인 닉네임입니다.</p>)}
                    {users.user_nick && isDuplicateNick === false && (<p style={{ color: 'green' }}>사용 가능한 닉네임입니다.</p>)}
                    <input
                        type="text"
                        name='user_id'
                        placeholder="아이디 입력 (영문, 숫자 조합 4~20자)"
                        value={users.user_id}
                        ref={idRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    {users.user_id.length >= 4 && isDuplicateId === true && (<p style={{ color: 'red' }}>이미 사용 중인 아이디입니다.</p>)}
                    {users.user_id.length >= 4 && isDuplicateId === false && (<p style={{ color: 'green' }}>사용 가능한 아이디입니다.</p>)}
                    <input
                        type="password"
                        name='user_pw'
                        placeholder="비밀번호을 입력하세요."
                        value={users.user_pw}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <input
                        type="password"
                        name='pwConfirm'
                        placeholder="비밀번호 확인."
                        value={pwConfirm}
                        ref={pwConfirmRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    {users.user_pw && pwConfirm && (
                    <p style={{ color: users.user_pw === pwConfirm ? 'green' : 'red' }}>
                        {users.user_pw === pwConfirm ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                    </p>
                    )}
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
                            ref={emailIdRef}
                            onChange={handleEmailChange}
                            onKeyDown={handleKeyDown}
                            style={{width:'45%'}}
                        />
                        <div style={{
                            width: '10%',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>@</div>
                        <input
                            list="email-domains"
                            placeholder="직접 입력"
                            value={emailDomain}
                            onChange={handleDomainChange}
                            onKeyDown={handleKeyDown}
                            style={{ width: '45%'}}
                        />
                        <datalist id="email-domains">
                            <option value="naver.com" />
                            <option value="gmail.com" />
                            <option value="hanmail.net" />
                        </datalist>
                    </div>
                    {users.user_email && isDuplicateEmail === true && (<p style={{ color: 'red' }}>이미 사용 중인 이메일입니다.</p>)}
                    {users.user_email && isDuplicateEmail === false && (<p style={{ color: 'green' }}>사용 가능한 이메일입니다.</p>)}

                    <div className='signUpBtn'
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '1rem 0',
                    }}>
                        <button style={buttonStyle} onClick={registerUser}>Sing Up</button>
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