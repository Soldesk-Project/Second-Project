import React from 'react';
import styles from '../../css/TestModal.module.css';

const TestModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

  // 배경 클릭 시 닫기, 내부 클릭 시 이벤트 전파 차단
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {title && <h2 className={styles.modalTitle}>{title}</h2>}
        <div className={styles.modalBody}>
          {children}
        </div>
        <button className={styles.closeButton} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default TestModal;