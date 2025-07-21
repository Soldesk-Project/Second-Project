import React, { useCallback, useEffect, useState } from 'react';
import styles from '../../css/NickModal.module.css'; // 필요 시 CSS 모듈
import { debounce } from 'lodash';
import axios from 'axios';

const NickModal = ({ isOpen, onClose, onSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [isDuplicateNick, setIsDuplicateNick] = useState(null);

  const handleSubmit = () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    onSubmit(nickname);  // 부모(UserInfo)에서 처리
    setNickname('');
    onClose();
  };

  const checkDuplicateNick = useCallback(
        debounce(async (userNick) => {
            try {
            const res = await axios.get(`/api/signUp/checkNick?user_nick=${userNick}`);
            setIsDuplicateNick(res.data.duplicate);
            } catch (err) {
            console.error("중복 확인 실패:", err);
            }
    }, 500), []);

    useEffect(() => {
        if (nickname.trim() !== '') {
            checkDuplicateNick(nickname);
        }
    }, [nickname]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{color:'black', textAlign:'center'}}>닉네임 변경</h3>
        <input
          type="text"
          placeholder="새 닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        {nickname && isDuplicateNick === true && (<p style={{ color: 'red' }}>이미 사용 중인 닉네임입니다.</p>)}
        {nickname && isDuplicateNick === false && (<p style={{ color: 'green' }}>사용 가능한 닉네임입니다.</p>)}
        <div className={styles.buttons}>
          <button onClick={handleSubmit}>변경</button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default NickModal;
