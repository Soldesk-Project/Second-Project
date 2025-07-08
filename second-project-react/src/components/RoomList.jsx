import React, { useEffect, useState, useContext } from 'react';
import ModalBasic from './ModalBasic';
import MatchModal from './MatchModal'; // ✅ 추가
import axios from 'axios';
import styles from '../css/RoomList.module.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WebSocketContext } from '../util/WebSocketProvider';

const RoomList = () => {
  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false); // ✅ 추가

  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const nav = useNavigate();

  const sockets = useContext(WebSocketContext);

  useEffect(() => {
    const socket = sockets['room'];
    if (!socket) return;

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
      switch (data.type) {
        case "roomList":
          setGameRoomList(data.rooms);
          break;
        case "roomCreated":
          socket.send(JSON.stringify({
            action: "joinRoom",
            roomNo: data.gameroom_no,
            userNick
          }));
          nav('/gameRoom/' + data.gameroom_no);
          break;
        default:
          break;
      }
    };

    socket.onclose = () => {
      setIsWsOpen(false);
    };
    socket.onerror = (error) => {
      console.error("WebSocket error (room):", error);
    };
  }, [server, userNick, sockets]);

  useEffect(() => {
    const matchSocket = sockets['match'];
    if (!matchSocket) return;

    if (matchSocket.readyState !== 1) {
      matchSocket.onopen = () => {
        console.log("🧩 매칭 소켓 연결 완료");
      };
    }

    matchSocket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
        console.log(data);
      } catch (e) {
        console.warn("🟠 JSON 파싱 실패:", event.data);
        return;
      }

      switch (data.type) {
        case "ACCEPT_MATCH":
          setShowMatchModal(true); // ✅ 모달 열기
          break;
        case "MATCH_FOUND":
          nav('/game');
          break;
        default:
          console.log("🟡 알 수 없는 매칭 메시지:", data);
          break;
      }
    };

    matchSocket.onerror = (err) => {
      console.error("WebSocket error (match):", err);
    };

    matchSocket.onclose = () => {
      console.log("🛑 매칭 소켓 종료됨");
    };
  }, [sockets]);

  const handleAccept = () => {
    const matchSocket = sockets['match'];
    if (matchSocket && matchSocket.readyState === 1) {
      matchSocket.send(JSON.stringify({
        action: 'acceptMatch',
        userId: user.user_id,
      }));
    }
    setShowMatchModal(false);
    nav('/game');
  };

  const handleReject = () => {
    const matchSocket = sockets['match'];
    if (matchSocket && matchSocket.readyState === 1) {
      matchSocket.send(JSON.stringify({
        action: 'rejectMatch',
        userId: user.user_id,
      }));
    }
    setShowMatchModal(false);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const joinRoom = (room) => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      if (room.limit > room.currentCount) {
        socket.send(JSON.stringify({
          action: "joinRoom",
          roomNo: room.gameroom_no,
          userNick
        }));
        nav('/gameRoom/' + room.gameroom_no);
      } else {
        alert("인원수가 가득 찼습니다");
      }
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다. -- joinRoom");
    }
  };

  const handleQuickMatch = async () => {
    console.log("🚀 handleQuickMatch 호출됨");

    try {
      await axios.post('/api/rank/score', { userId: user.user_id });
      const matchSocket = sockets['match'];
      if (!matchSocket) {
        alert("웹소켓 연결이 존재하지 않습니다.");
        return;
      }

      if (matchSocket.readyState === 1) {
        matchSocket.send(JSON.stringify({
          action: 'quickMatch',
          userId: user.user_id
        }));
      } else if (matchSocket.readyState === 0) {
        matchSocket.onopen = () => {
          matchSocket.send(JSON.stringify({
            action: 'quickMatch',
            userId: user.user_id
          }));
        };
      } else {
        alert("웹소켓이 닫혀있습니다.");
      }

    } catch (err) {
      console.error('❌ 빠른 매칭 실패:', err);
      alert('빠른 매칭 중 오류가 발생했습니다!');
    }
  };

  return (
    <>
      {modalOpen && <ModalBasic setModalOpen={setModalOpen} socket={sockets['room']} isWsOpen={isWsOpen} />}
      {showMatchModal && (
        <MatchModal onAccept={handleAccept} onReject={handleReject} />
      )}

      <div className={styles.roomListHeader}>
        <button onClick={handleOpenModal} className={styles.createBtn}>필터</button>
        <button onClick={handleOpenModal} className={styles.createBtn}>일반 게임</button>
        <button onClick={handleQuickMatch} className={styles.createBtn}>랭크 게임</button>
        <button onClick={handleQuickMatch} className={styles.createBtn}>오답 풀이</button>
      </div>

      <div className={styles.roomListBody}>
        {gameRoomList.length === 0 ? (
          <div>방이 없음</div>
        ) : (
          gameRoomList.map((room, index) => (
            <div key={index} className={styles.roomCard} onDoubleClick={() => joinRoom(room)}>
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
