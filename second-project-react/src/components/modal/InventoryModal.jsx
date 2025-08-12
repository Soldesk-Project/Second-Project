import React, { useEffect } from 'react';
import styles from '../../css/modal/InventoryModal.module.css';

const InventoryModal = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.modal_overlay} onClick={handleOverlayClick}>
            <div className={styles.modal_content} onClick={e => e.stopPropagation()}>
                <button className={styles.modal_close} onClick={onClose}>×</button>
                {children}
            </div>
        </div>
    );
};

export default InventoryModal;