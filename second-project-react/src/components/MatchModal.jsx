import React from 'react';
import '../css/MatchModal.css';

const MatchModal = ({ socket, currentUserId, setShowMatchModal, setMatchStatus }) => {

  console.log(socket);
  

  const onAccept = () => {
    socket.send(JSON.stringify({
      action: "acceptMatch",
      userId: currentUserId
    }));
    setMatchStatus('waiting'); // 상대 수락 대기 상태로 전환
  };

  const onReject = () => {
    socket.send(JSON.stringify({
      action: "rejectMatch",
      userId: currentUserId
    }));
    setShowMatchModal(false); // 모달 닫기
    setMatchStatus('idle');
  };

  return (
    <div className="match-modal-backdrop">
      <div className="match-modal">
        <h2>🎮 2명이 매칭되었습니다!</h2>
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
