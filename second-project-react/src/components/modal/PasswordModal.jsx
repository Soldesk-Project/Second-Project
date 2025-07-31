import React, { useState } from 'react';
import styles from '../../css/passwordModal.module.css';

const PasswordModal = ({setPassword, setPasswordMadal, selectedRoom, enterRoom}) => {
  const [roomPassword, setRoomPassword] = useState('');


  const checkPassword=()=>{
    const regex = /^\d{4}$/;
    if (!regex.test(roomPassword)) {
      alert('비밀번호는 숫자 4자리만 입력 가능합니다.')
      return;
    }

    if (roomPassword === selectedRoom.pwd) {
      setPassword(roomPassword);
      close();
      enterRoom();
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  }

  const close=()=>{
    setPasswordMadal(false);
    
  }

  return (
    <div className={styles.PasswordModalContainer}>
      <div className={styles.modalTitle}>
        <span>입장하려면 해당 방의 비밀번호를 입력하세요</span> &nbsp;
      </div>
      <div className={styles.modalContent}>
        <input type="password"
               value={roomPassword}
               onChange={(e)=>setRoomPassword(e.target.value)}
               placeholder='숫자 4자리 입력'
               />
      </div>
      <div className={styles.buttonWrapper}>
        <button className={styles.close} onClick={close}>취소</button>
        <button className={styles.checkPassword} onClick={checkPassword}>확인</button>
      </div>
    </div>
  );
};

export default PasswordModal;