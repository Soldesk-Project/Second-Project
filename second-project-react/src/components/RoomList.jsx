import React, { useEffect, useState } from 'react';
import ModalBasic from './ModalBasic';
import axios from 'axios';

const RoomList = () => {

  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const getGameRoomList = async () => {
     const resp = await axios.get('/api/showRoom');
     if(resp.status === 200){
      const data = resp.data;
      setGameRoomList(data);
     }else{
      new Error('게임 방 가져오기 실패...');
     }
  }

  useEffect(() => {
    getGameRoomList();
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
  }

  return (
    <div>
      <button onClick={handleOpenModal}>방 생성</button>
      {modalOpen && <ModalBasic setModalOpen={setModalOpen} />}

      <ul>
        {gameRoomList.map((room, index) => (
          <li key={index}>{room.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default RoomList;