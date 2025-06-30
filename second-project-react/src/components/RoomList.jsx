import React, { useEffect, useState } from 'react';
import ModalBasic from './ModalBasic';
import axios from 'axios';
import '../css/RoomList.module.css'; // CSS 따로 적용

const RoomList = () => {
  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const getGameRoomList = async () => {
    try {
      const resp = await axios.get('/api/showRoom');
      if (resp.status === 200) {
        setGameRoomList(resp.data);
      }
    } catch (err) {
      console.error('게임 방 가져오기 실패:', err);
    }
  };

  useEffect(() => {
    getGameRoomList();
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <button onClick={handleOpenModal} className="create-btn">방 생성</button>
      </div>

      {modalOpen && <ModalBasic setModalOpen={setModalOpen} />}

      <div className="room-list-body">
        {gameRoomList.length === 0 ? (
          <div className="loading">Loading...</div>
        ) : (
          gameRoomList.map((room, index) => (
            <div key={index} className="room-card">
              <div className="room-mode">{room.game_mode === 'rank' ? 'Rank Mode' : 'Casual Mode'}</div>
              <div className="room-title">{room.title}</div>
              <div className="room-meta">
                <span>{room.limit}명</span>
                <span>{room.is_private === 'Y' ? '비공개' : '공개'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
