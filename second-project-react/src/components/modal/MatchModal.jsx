import React, { useEffect, useState } from 'react';
import styles from '../../css/MatchModal.module.css';

const MatchModal = ({ socket, currentUserId, setShowMatchModal, setMatchStatus }) => {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [progress, setProgress] = useState(100); // 퍼센트로 관리

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === 1) {
          clearInterval(countdown);
          handleTimeout(); // 자동 거절
        }
        return prev - 1;
      });
    }, 1000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(prev - 10, 0)); // 10초 → 100 → 90 → 80 ... 0
    }, 1000);

    return () => {
      clearInterval(countdown);
      clearInterval(progressInterval);
    };
  }, []);

  const handleAccept = () => {
    socket.send(JSON.stringify({
      action: "acceptMatch",
      userId: currentUserId
    }));
    setMatchStatus('waiting');
    setShowMatchModal(false);
  };

  const handleReject = () => {
    socket.send(JSON.stringify({
      action: "rejectMatch",
      userId: currentUserId
    }));
    setMatchStatus('idle');
    setShowMatchModal(false);
  };

  const handleTimeout = () => {
    socket.send(JSON.stringify({
      action: "timeOut",
      userId: currentUserId
    }));
    setMatchStatus('idle');
    setShowMatchModal(false);
  }
  
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2>🧩 매칭이 완료되었습니다!</h2>
        <p>게임을 수락하시겠습니까?</p>

        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={styles.countdownText}>
            ⏳ {secondsLeft}초 후 자동 거절
          </div>
        </div>

        <div className={styles.buttons}>
          <button className={styles.accept} onClick={handleAccept}>✅ 수락</button>
          <button className={styles.reject} onClick={handleReject}>❌ 거절</button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
