import React from 'react';
import styles from '../../css/LeaveModal.module.css';

const LeaveModal = ({ onConfirm, onCancel, gameMode, play }) => {

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {
          (gameMode === 'normal')?(
            (!play)?(
              <>
                <p>정말 게임을 나가시겠습니까?</p>
                <div className={styles.actions}>
                  <button onClick={onConfirm} className={styles.confirmBtn}>확인</button>
                  <button onClick={onCancel} className={styles.cancelBtn}>취소</button>
                </div>
              </>
            ):(
            <>
              <p>정말 게임을 나가시겠습니까?</p>
              <p>포인트가 지급되지 않고 지금까지 푼 문제가 저장되지 않습니다</p>
              <div className={styles.actions}>
                <button onClick={onConfirm} className={styles.confirmBtn}>확인</button>
                <button onClick={onCancel} className={styles.cancelBtn}>취소</button>
              </div>
            </>
            )
          ):(
            <>
              <p>정망 게임을 나가시겠습니까?</p>
              <p>점수가 하락하고 지금까지 푼 문제가 저장되지 않습니다</p>
              <div className={styles.actions}>
                <button onClick={onConfirm} className={styles.confirmBtn}>확인</button>
                <button onClick={onCancel} className={styles.cancelBtn}>취소</button>
              </div>
            </>
          )
        }
      </div>
    </div>
  );
};

export default LeaveModal;
