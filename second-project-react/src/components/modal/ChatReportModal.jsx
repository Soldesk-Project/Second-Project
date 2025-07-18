import React from 'react';
import '../../css/chatbox.css';

const ChatReportModal = ({ isOpen, onClose, onReportSubmit }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>채팅 신고</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>현재 접속해 있는 서버의 최근 대화를 저장하여 신고할 수 있습니다. 신고하기를 눌러 신고해주시면 해당 내용을 관리자가 확인 후 문제가 있을 경우 제재가 진행됩니다.</p>
                    {/* 필요하다면 여기에 신고할 메시지 내용을 보여줄 수 있습니다. */}
                    {/*
                    <div className="report-preview">
                        <h3>신고 대상 메시지 (예시)</h3>
                        {recentMessages.map((msg, idx) => ( // 예시: recentMessages를 props로 받아서 사용
                            <p key={idx}>[{formatTimestamp(msg.mTimestamp)}] {msg.mSender}: {msg.mContent}</p>
                        ))}
                    </div>
                    */}
                </div>
                <div className="modal-footer">
                    <button id="cancelBtn" className="cancel-btn" onClick={onClose}>취소</button>
                    <button id="reportSendBtn" className="report-send-btn" onClick={onReportSubmit}>신고하기</button>
                </div>
            </div>
        </div>
    );
};

export default ChatReportModal;