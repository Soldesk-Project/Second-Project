import React, { useCallback, useContext, useEffect, useState } from 'react';
import styles from '../../css/NickModal.module.css'; // 필요 시 CSS 모듈
import { debounce } from 'lodash';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { WebSocketContext } from '../../util/WebSocketProvider';

const NickModal = ({ isOpen, onClose, onSubmit, point }) => {
  const [nickname, setNickname] = useState('');
  const [isDuplicateNick, setIsDuplicateNick] = useState(null);
  const [lastCheckedNickname, setLastCheckedNickname] = useState('');

  const user = useSelector((state) => state.user);
  const socket = useContext(WebSocketContext);
  
  const handleSubmit = () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (nickname !== lastCheckedNickname) {
      alert('닉네임 중복 확인 중입니다. 잠시만 기다려주세요.');
      return;
    }
    if (isDuplicateNick === true) {
      alert('이미 사용 중인 닉네임입니다.');
      return;
    }
    onSubmit(nickname);  // 부모(UserInfo)에서 처리

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: 'updateNick',
        userNo: user.user_no,
        userNick: nickname,
      }));
    }
    setNickname('');
    onClose();
  };

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
        if (nickname.trim() !== '') {
            checkDuplicateNick(nickname);
        }
    }, [nickname]);

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

  if (!isOpen) return null;

  return (
    <div className={styles.container} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{color:'black', textAlign:'center'}}>닉네임 변경</h3>
        <input
          type="text"
          placeholder="새 닉네임"
          className={styles.nickModalInput}
          value={nickname}
          onKeyDown={handleKeyDown}
          onChange={(e) => setNickname(e.target.value)}
        />
        {nickname && isDuplicateNick === true && (<p style={{ color: 'red' }}>이미 사용 중인 닉네임입니다.</p>)}
        {nickname && isDuplicateNick === false && (<p style={{ color: 'green' }}>사용 가능한 닉네임입니다.</p>)}
        <div className={styles.point}>
          <p>닉네임 변경시 5000p가 소모됩니다.</p>
          <p>내 보유 포인트 : {point}p</p>
        </div>
        
        <div className={styles.buttonWrapper}>
          <button className={styles.closeBtn} onClick={onClose}>취소</button>
          <button className={styles.changeBtn} onClick={handleSubmit}>변경</button>
        </div>
      </div>
    </div>
  );
};

export default NickModal;
