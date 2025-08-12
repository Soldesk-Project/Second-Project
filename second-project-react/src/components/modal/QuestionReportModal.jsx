import React, { useState } from 'react';
import styles from '../../css/modal/QuestionReportModal.module.css';
import axios from 'axios';
import { useSelector } from 'react-redux';

const QuestionReportModal = ({ onClose, question }) => {
  const { user } = useSelector((state) => state.user);
  const [reason, setReason] = useState('');
  const userNick = user?.user_nick;

  // 문제 오류 신고
    const reportQuestion = async () => {
      try {
        const res = await axios.post('/api/reportQuestion', {
          subject: question.subject,
          question_id: question.question_id,
          question_text: question.question_text,
          option_1: question.option_1,
          option_2: question.option_2,
          option_3: question.option_3,
          option_4: question.option_4,
          correct_answer: question.correct_answer,
          image_data: question.image_data,
          reason: reason, // 필요 시 base64 or null
          user_nick: userNick,          // 신고한 사용자
        });
        alert('문제 오류 신고가 접수되었습니다.');
        onClose();
      } catch (err) {
        console.error('신고 실패:', err);
        alert('신고 중 오류가 발생했습니다.');
      }
    };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>문제 오류 신고</h2>
        
        {/* 신고 사유 입력란 예시 */}
        <textarea placeholder="신고 사유를 입력하세요" className={styles.textarea} value={reason} onChange={(e) => setReason(e.target.value)}/>
        
        <div className={styles.buttonRow}>
          <button onClick={onClose} className={styles.cancelBtn}>취소</button>
          <button onClick={()=>reportQuestion()} className={styles.submitBtn}>신고하기</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionReportModal;
