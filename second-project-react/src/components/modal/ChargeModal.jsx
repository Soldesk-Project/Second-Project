import React, { useState } from 'react';
import styles from '../../css/modal/ChargeModal.module.css';
import { useSelector } from 'react-redux';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import axios from 'axios';

const ChargeModal = ({ onClose }) => {
  const [amount, setAmount] = useState(1000);
  const userId = useSelector((state) => state.user.user.user_id);
  
  const tossClientKey = 'test_ck_ALnQvDd2VJ6enAxbomzxVMj7X41m'; // ✅ 토스 클라이언트 키

  // ✅ 카카오페이 처리 (기존 방식 유지)
  // const handleKakaoPay = async () => {
  //   try {
  //     const res = await axios.post('/api/pay/kakao', { userId, amount });
  //     window.location.href = res.data;
  //   } catch (err) {
  //     alert('카카오페이 결제 요청 실패');
  //     console.error(err);
  //   }
  // };

  // ✅ 토스페이 처리 (JS SDK로 직접 호출)
  const handleTossPay = async () => {
    try {
      const tossPayments = await loadTossPayments(tossClientKey);
      const orderId = 'order_' + Date.now();

      tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName: '포인트 충전',
        customerName: userId,
        successUrl: `http://192.168.0.112:9099/api/pay/toss/success?userId=${userId}`, // ✅ 수정
        failUrl: 'http://192.168.0.112:3000/pay/fail',
      });
    } catch (err) {
      alert('토스 결제 실패');
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
      <button onClick={handleTossPay}>충전하기</button>
      <button onClick={onClose}>닫기</button>
    </div>
  );
};

export default ChargeModal;
