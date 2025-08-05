import React, { useState } from 'react';
import '../../css/chatbox.css';
import axios from 'axios';

const ChatReportModal = ({ isOpen, onClose, reportMessage }) => {
    const [reportedReason, setReportedReason] = useState('');
    const token = localStorage.getItem('token');
    if (!isOpen) return null;
    console.log(reportMessage.mSender);

    const handleReportSubmit=async()=>{
        if (reportedReason.length>100) {
            alert("신고 사유는 100글자 미만으로 입력해 주세요.");
            return;
        }
        
        try {
            const res = await axios.post('/chat/report',{reported_user: reportMessage.mSender, message: reportMessage.mContent, reason: reportedReason, status: 'pending'},{
                headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
                }
            });
            alert(res.data);
            onClose();
        } catch (error) {
            alert('채팅 신고 등록 에러 발생');      
        }

        setReportedReason('');
    }


    return (
        <div className="modal-overlay">
            <div className="chat-modal-content">
                <div className="chat-modal-header">
                    <h2>채팅 신고</h2>
                </div>
                <div className="modal-body">
                    <p>현재 접속해 있는 서버의 최근 대화를 저장하여 신고할 수 있습니다.<br/>신고하기를 눌러 신고해주시면 해당 내용을 관리자가 확인 후 문제가 있을 경우 제재가 진행됩니다.</p>
                    {/* 필요하다면 여기에 신고할 메시지 내용을 보여줄 수 있습니다. */}
                    <div>
                        {
                            <p className='report-preview'>{reportMessage.mSender} : {reportMessage.mContent}</p>
                        }
                    </div>
                    <div>
                        <input type="text" className='reported-reason' value={reportedReason} onChange={(e)=>setReportedReason(e.target.value)} placeholder='신고 사유를 적어주세요'/>
                    </div>
                </div>
                <div className="chat-modal-footer">
                    <button id="cancelBtn" className="cancel-btn" onClick={onClose}>취소</button>
                    <button id="reportSendBtn" className="report-send-btn" onClick={handleReportSubmit}>신고하기</button>
                </div>
            </div>
        </div>
    );
};

export default ChatReportModal;