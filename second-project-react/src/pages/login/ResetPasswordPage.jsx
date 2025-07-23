import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import styles from '../../css/ResetPasswordPage.module.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPw, setNewPw] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    try {
      const res = await axios.post('/api/reset-password', { token, newPw });
      setMessage(res.data.message);
      
    } catch (err) {
      setMessage(err.response.data.message || '오류 발생');
    }
  };
  
  return (
    <div className={styles.background}>
        <img src='/images/logo.png' alt='로고이미지'/>
        <div className={styles.box} >
            <h2>비밀번호 재설정</h2>
            <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="새 비밀번호"
            />
            <button onClick={handleReset}>비밀번호 변경</button>
            <p style={{ color: 'green' }}>{message}</p>
        </div>
    </div>
  );
};

export default ResetPasswordPage;
