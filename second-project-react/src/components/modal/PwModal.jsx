import React, { useState } from 'react';
import styles from '../../css/modal/PwModal.module.css';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createLogoutHandler } from '../../js/logout';
import { clearUser, clearServer } from '../../store/userSlice';

const PwModal = ({ isOpen, onClose, onSubmit }) => {
    const [pw, setPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [certification, setCertification] = useState(false);
    const [certificationNumber, setCertificationNumber] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    
    const dispatch = useDispatch();

    const user = useSelector((state) => state.user);
    
    // 현재 비번 맞는지 확인
    const handleCheckPw = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const {data} = await axios.post(`/api/changePw/checkPw`,{
                user_pw: pw,
                user_id: user.user.user_id,
                user_email: user.user.user_email,
            });
            if (data.success) {
                alert(data.message);
                setToken(data.token);
                setCertification(true);
            }else {
                alert(data.message);
                setPw('');
            }
        } catch (error) {
            alert('현재 비밀번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    }

    // 인증번호 확인, 새 비밀번호 저장
    const handleSubmit = async () => {
        if (newPw===pw) {
            alert("새 비밀번호가 현재 비밀번호와 동일합니다");
            return;
        }
        try {
            const {data} = await axios.post('/api/changePw/verifyCertification', { 
                token: token, 
                newPw: newPw,
                certificationNumber: certificationNumber
            });
            alert(data.message);
            if (data.success) {
                setPw('');
                handleClose();
                logOut();
                // navigate('/', { replace: true })
            }
        } catch (err) {
            alert('인증번호 확인 중 오류가 발생했습니다.');
        }
    }

    const logOut = createLogoutHandler({
        dispatch,
        clearUser,
        clearServer,
        nav: navigate,
        user,
        sendLeaveMessage: () => {}
    });


    const handleClose = () => {
        setPw('');
        setNewPw('');
        setCertification(false);
        setCertificationNumber('');
        onClose();
    }
    
    if (!isOpen) return null

    return (
        <div className={styles.container} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3>비밀번호 변경</h3>
                <div className={styles.pwModalInputDiv}>
                    <input
                        type="password"
                        placeholder="현재 비밀번호"
                        className={styles.pwModalInput}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        disabled={certification}
                    />
                    {
                        certification && 
                        <>
                            <input
                                type="password"
                                placeholder="새 비밀번호"
                                className={styles.pwModalInput}
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                />
                            <input 
                                type="text"
                                placeholder='인증번호'
                                className={styles.pwModalInput}
                                value={certificationNumber}
                                onChange={(e) => setCertificationNumber(e.target.value)}/>
                        </>
                    }
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.closeBtn} onClick={handleClose}>취소</button>
                    {
                        certification?
                        <button className={styles.changeBtn} onClick={handleSubmit}>인증</button>:
                        <button className={styles.changeBtn} onClick={handleCheckPw} disabled={loading}>{loading ? '요청 중...' : '변경'}</button>
                    }
                </div>
            </div>
        </div>
    );
};

export default PwModal;