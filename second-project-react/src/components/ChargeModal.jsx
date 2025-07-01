// ChargeModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import styles from '../css/ChargeModal.module.css';
import { useSelector } from 'react-redux'; // ✅ Redux 상태 가져오기

const ChargeModal = ({ onClose }) => {
  const [amount, setAmount] = useState(1000);

  // ✅ Redux에서 로그인된 사용자 userId 가져오기
  const userId = useSelector((state) => state.user.user.user_id); // ← 정확함
  console.log('userId:', userId); // 확인용
  // 위 경로는 프로젝트에 따라 조정 (예: state.auth.user.userId 등)

  const handlePayment = async (method) => {
    try {
      const res = await axios.post(`/api/pay/${method}`, {
        userId,   // ✅ 반드시 포함
        amount
      });
      window.location.href = res.data; // 카카오/토스 결제창 URL로 이동
    } catch (err) {
      console.log(method);
      alert('결제 요청 실패');
      console.error(err);
    }
  };

  return (
    <div className={styles.modal}>
      <h3>포인트 충전</h3>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={() => handlePayment('toss')}>토스페이로 결제</button>
      <button onClick={() => handlePayment('kakao')}>카카오페이로 결제</button>
      <button onClick={onClose}>닫기</button>
    </div>
  );
};

export default ChargeModal;
