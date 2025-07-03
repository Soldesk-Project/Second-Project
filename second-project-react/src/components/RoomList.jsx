import React, { useEffect, useState, useContext } from 'react';
import ModalBasic from './ModalBasic';
import styles from '../css/RoomList.module.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { WebSocketContext } from '../util/WebSocketProvider';

const RoomList = () => {
  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const nav = useNavigate();

  const stompRef = React.useRef(null);
  const sockets = useContext(WebSocketContext); // 여러 소켓을 context에서 받아옴

  useEffect(() => {
    const socket = sockets['room'];
    if (!socket) return;

    // 연결이 이미 되어 있다면 바로 사용, 아니라면 onopen에서 처리
    if (socket.readyState === 1) {
      setIsWsOpen(true);
      socket.send(JSON.stringify({ action: "join", server, userNick }));
    } else {
      socket.onopen = () => {
        setIsWsOpen(true);
        socket.send(JSON.stringify({ action: "join", server, userNick }));
      };
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "roomList") {
        setGameRoomList(data.rooms);
      }
      if (data.type === "roomCreated") {
        socket.send(JSON.stringify({
          action: "joinRoom",
          roomNo: data.gameroom_no,
          userNick: userNick
        }));
        nav('/gameRoom/' + data.gameroom_no);
      }
    };

    socket.onclose = () => {
      setIsWsOpen(false);
    };
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // cleanup은 필요시만 (Provider에서 관리하므로 여기선 생략)
  }, [server, userNick, sockets]);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const joinRoom = (roomNo) => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: "joinRoom",
        roomNo: roomNo,
        userNick: userNick
      }));
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다.");
    }
    nav('/gameRoom/' + roomNo);
  };

  const handleQuickMatch = async () => {
    try {
      await axios.post('/api/match/join', {
        userId: user.user_id,
      });

      console.log('✅ 매칭 큐 등록 완료');

      const sock = new SockJS('http://192.168.0.112:9099/ws-match?userId=' + user.user_id);
      const stomp = Stomp.over(sock);

      stomp.connect({}, () => {
        console.log('✅ STOMP 연결 완료');
        stomp.subscribe('/user/queue/match', (message) => {
          const payload = message.body;
          if (payload === 'ACCEPT_MATCH') {
            alert('4명이 모였습니다! 게임을 수락하시겠습니까?');
          }
          if (payload === 'MATCH_FOUND') {
            nav('/game');
          }
        });
      });

      stompRef.current = stomp;
    } catch (err) {
      console.error('❌ 빠른 매칭 실패:', err);
      alert('빠른 매칭 중 오류가 발생했습니다!.');
    }
  };

  return (
    <>
      {modalOpen && <ModalBasic setModalOpen={setModalOpen} socket={sockets['room']} isWsOpen={isWsOpen} />}
      <div className={styles.roomListHeader}>
        <button onClick={handleOpenModal} className={styles.createBtn}>필터</button>
        <button onClick={handleOpenModal} className={styles.createBtn}>방 생성</button>
        <button onClick={handleQuickMatch} className={styles.createBtn}>빠른매칭</button>
        <input type="text" className={styles.roomListSearch} placeholder='search...' />
      </div>

      <div className={styles.roomListBody}>
        {gameRoomList.length === 0 ? (
          <div>방이 없음</div>
        ) : (
          gameRoomList.map((room, index) => (
            <div key={index} className={styles.roomCard} onDoubleClick={() => joinRoom(room.gameroom_no)}>
              <span>{room.gameroom_no}</span>
              <span className={styles.roomMode}>{room.game_mode === 'rank' ? 'Rank Mode' : 'Casual Mode'}</span>
              <div className={styles.roomTitle}>{room.title}</div>
              <div className={styles.roomMeta}>
                <span>{room.currentCount ?? 0} / {room.limit}명</span>
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
