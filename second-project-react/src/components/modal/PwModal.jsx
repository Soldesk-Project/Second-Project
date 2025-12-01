import React, { useState } from 'react';
import styles from '../../css/modal/NickModal.module.css';
import axios from 'axios';

const PwModal = ({ isOpen, onClose, onSubmit }) => {
    const [pw, setPw] = useState('');


    const handleSubmit = () => {
        
        console.log(1234);
        
        
        
        
        setPw('');
        onClose();
    }
    
    if (!isOpen) return null

    return (
        <div className={styles.container} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>비밀번호 변경</h3>
            <input
                type="text"
                placeholder="새 비밀번호"
                className={styles.nickModalInput}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
            />
            <div className={styles.buttonWrapper}>
                <button className={styles.closeBtn} onClick={onClose}>취소</button>
                <button className={styles.changeBtn} onClick={handleSubmit}>변경</button>
            </div>
            </div>
        </div>
    );
};

export default PwModal;