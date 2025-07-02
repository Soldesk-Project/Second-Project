import React, { useEffect, useRef, useState } from 'react';
import ModalBasic from './ModalBasic';
import styles from '../css/RoomList.module.css'; // CSS 따로 적용
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoomList = () => {
  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const socketRef=useRef(null);
  const nav=useNavigate();

  useEffect(() => {
    // getGameRoomList();
    if (socketRef.current) {
      socketRef.current.close();
    }

    // socketRef.current = new WebSocket("ws://192.168.0.112:9099/ws/server");
    socketRef.current = new WebSocket("ws://localhost:9099/ws/room");

    socketRef.current.onopen = () => {
      console.log("WebSocket 연결 성공");
      setIsWsOpen(true);  // 연결 성공 상태 업데이트
      socketRef.current.send(
        JSON.stringify({ action: "join", server, userNick})
      );
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "roomList") {
        setGameRoomList(data.rooms);
        console.log(data.rooms);
      }
      // 방 생성 성공 시, 방 목록이 자동으로 갱신된다고 가정
    };

    socketRef.current.onclose = () => {
      setIsWsOpen(false); // 연결 종료 상태 업데이트
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };

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
      {modalOpen && <ModalBasic setModalOpen={setModalOpen} socket={socketRef.current} isWsOpen={isWsOpen}/>}
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
