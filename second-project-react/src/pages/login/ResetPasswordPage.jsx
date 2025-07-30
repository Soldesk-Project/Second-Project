import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import styles from '../../css/ResetPasswordPage.module.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPw, setNewPw] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(null);

  const handleReset = async () => {
    try {
      const res = await axios.post('/api/reset-password', { token, newPw });
      setMessage(res.data.message);
      setCountdown(5);
    } catch (err) {
      setMessage(err.response.data.message || '오류 발생');
    }
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      window.close();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleReset();
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
                onKeyDown={handleKeyDown}
            />
            <button onClick={handleReset}>비밀번호 변경</button>
            {message && (
              <p style={{ color: 'green' }}>
                {message}
                {countdown !== null && countdown > 0 && ` (${countdown}초)`}
              </p>
            )}
        </div>
    </div>
  );
};

export default ResetPasswordPage;
