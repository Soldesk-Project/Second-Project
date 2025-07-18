import React from 'react';
import '../../css/chatbox.css';

function formatExpiryDate(bannedTimestamp) {
    if (!bannedTimestamp) return '알 수 없음';

    const bannedDate = new Date(bannedTimestamp);
    if (isNaN(bannedDate.getTime())) {
        return '알 수 없음 (유효하지 않은 시간)';
    }

    // 3일 (72시간) 추가
    const expiryDate = new Date(bannedDate.getTime() + 72 * 60 * 60 * 1000);

    const year = expiryDate.getFullYear();
    const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const day = String(expiryDate.getDate()).padStart(2, '0');
    const hours = String(expiryDate.getHours()).padStart(2, '0');
    const minutes = String(expiryDate.getMinutes()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
}

const ChatBanModal = ({ isOpen, onClose, bannedTimestamp }) => {
    if (!isOpen) return null;

    const expiryMessage = formatExpiryDate(bannedTimestamp);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>3일 채팅 제한</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>해당 계정은 비매너적인 언어폭력 행위가 확인되어 채팅 제재 시스템에 따라 3일간 채팅이 불가능합니다.</p>
                    <p>채팅 제한 해제 시점: {expiryMessage} 까지</p>
                    <p>향후 매너있는 채팅 행위 부탁드립니다.</p>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default ChatBanModal;