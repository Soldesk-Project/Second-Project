import React, { useEffect, useState } from 'react';
import ModalBasic from './ModalBasic';
import Loading from '../components/Loading';
import axios from 'axios';
import styles from '../css/RoomList.module.css'; // CSS 따로 적용
import { useNavigate } from 'react-router-dom';

const RoomList = () => {
  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const nav=useNavigate();

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

  const joinRoom=(roomNo)=>{
    console.log(roomNo);
    nav('/gameRoom/'+roomNo);
  }


  return (
    <>
      {modalOpen && <ModalBasic setModalOpen={setModalOpen} />}
      <div className={styles.roomListHeader}>
        <button onClick={handleOpenModal} className={styles.createBtn}>필터</button>
        <button onClick={handleOpenModal} className={styles.createBtn}>방 생성</button>
        <button onClick={handleOpenModal} className={styles.createBtn}>빠른매칭</button>
        <input type="text" className={styles.roomListSearch} placeholder='search...'/>
      </div>
      <div className={styles.roomListBody}>
        {gameRoomList.length === 0 ? (
          <div>방이 없음</div>
          // <div><Loading /></div>
        ) : (
          gameRoomList.map((room, index) => (
            <div key={index} className={styles.roomCard} onDoubleClick={()=>joinRoom(room.gameroom_no)}>
              <span>{room.gameroom_no}</span>
              <span className={styles.roomMode}>{room.game_mode === 'rank' ? 'Rank Mode' : 'Casual Mode'}</span>
              <div className={styles.roomTitle}>{room.title}</div>
              <div className={styles.roomMeta}>
                <span>{room.limit}명</span>
                <span>{room.is_private === 'Y' ? '비공개' : '공개'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default RoomList;
