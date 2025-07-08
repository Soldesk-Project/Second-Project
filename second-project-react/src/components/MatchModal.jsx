import React from 'react';
import '../css/MatchModal.css'; // 스타일은 아래에 따로 예시 있음

const MatchModal = ({ onAccept, onReject }) => {
  return (
    <div className="match-modal-backdrop">
      <div className="match-modal">
        <h2>✅ 4명이 모였습니다!</h2>
        <p>게임을 수락하시겠습니까?</p>
        <div className="match-modal-buttons">
          <button onClick={onAccept}>수락</button>
          <button onClick={onReject}>거절</button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
