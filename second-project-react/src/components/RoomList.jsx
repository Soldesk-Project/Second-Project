import React, { useEffect, useState, useContext } from 'react';
import ModalBasic from './ModalBasic';
import MatchModal from './MatchModal';
import axios from 'axios';
import styles from '../css/RoomList.module.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { WebSocketContext } from '../util/WebSocketProvider';

const RoomList = () => {
  const [category, setCategory] = useState('random');
  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchStatus, setMatchStatus] = useState('idle'); // 'idle' | 'pending' | 'waiting'

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
            server: data.server,
            category: data.category,
            game_mode: data.game_mode,
            userNick
          }));
          
          nav('/gameRoom/' + data.gameroom_no, { state: { category: data.category, gameMode: data.game_mode } });
          break;
        default:
          break;
      }
    };

    socket.onclose = () => setIsWsOpen(false);
    socket.onerror = (error) => console.error("WebSocket error (room):", error);
  }, [server, userNick, sockets]);

  useEffect(() => {
    const matchSocket = sockets['match'];
    const socket = sockets['room'];
    if (!matchSocket) return;

    if (matchSocket.readyState !== 1) {
      matchSocket.onopen = () => console.log("🧩 매칭 소켓 연결 완료");
    }

    matchSocket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
        console.log(data);
      } catch {
        console.warn("🟠 JSON 파싱 실패:", event.data);
        return;
      }

      switch (data.type) {
        case "ACCEPT_MATCH":
          setMatchStatus('pending');
          setShowMatchModal(true);
          break;
          
        case "MATCH_FOUND":
          if (data.roomLeaderId === user.user_id) {
            const roomData = {
              action: "createRoom",
              title : "",
              category: "random",
              server: data.server,
              gameroom_no: data.gameroom_no,
              game_mode : "rank",
              is_private : "N",
              limit : "4",
              pwd : null
            };
            if (socket && socket.readyState === 1) {
              socket.send(JSON.stringify(roomData));
            } else {
              alert("웹소켓 연결이 준비되지 않았습니다.--createRoom");
            }
          } else {
            const joinData = {
              action: "joinRoom",
              roomNo: data.gameroom_no,
              server: data.server,
              game_mode: "rank",
              category: "random",
              userNick: user.user_nick
            };
            if(socket && socket.readyState === 1){
              socket.send(JSON.stringify(joinData))
              nav('/gameRoom/' + data.gameroom_no, {state : {gameMode : "rank"}});
            }
          }
          break;

        case "MATCH_CANCELLED":
          alert("상대방이 매칭을 거절했습니다.");
          setShowMatchModal(false);
          setMatchStatus('searching');
          break;
        
        case "MATCH_TIMEOUT":
          alert("시간초과");
          setShowMatchModal(false);
          setMatchStatus('idle');
          break;

        default:
          console.log("🟡 알 수 없는 매칭 메시지:", data);
      }
    };

    matchSocket.onerror = (err) => console.error("WebSocket error (match):", err);
    matchSocket.onclose = () => console.log("🛑 매칭 소켓 종료됨");
  }, [sockets, nav]);

  const handleQuickMatch = async () => {
    setMatchStatus('searching');

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

  const handleOpenModal = () => setModalOpen(true);

  const joinRoom = (room) => {
    console.log(room);
    
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      if (room.limit > room.currentCount) {
        console.log(room.game_mode);
        
        socket.send(JSON.stringify({
          action: "joinRoom",
          roomNo: room.gameroom_no,
          game_mode: room.game_mode,
          category: room.category,
          userNick
        }));
        nav('/gameRoom/' + room.gameroom_no, {state : {gameMode : room.game_mode}});
      } else {
        alert("인원수가 가득 찼습니다");
      }
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다.");
    }
  };

  const handleCancelMatch = () => {
    const matchSocket = sockets['match'];
    if (matchSocket && matchSocket.readyState === 1) {
      matchSocket.send(JSON.stringify({
        action: 'cancelMatch',
        userId: user.user_id
      }));
    }
    setMatchStatus('idle');
    setShowMatchModal(false);
  };

  const setKoreanToCategory=(category)=>{
    switch (category) {
      case "random":
        return "랜덤";
      case "CPE_Q":
        return "정보처리기사";
      case "CPEI_Q":
        return "정보처리산업기사";
      case "CPET_Q":
        return "정보처리기능사";
      case "LM1_Q":
        return "리눅스마스터1급";
      case "LM2_Q":
        return "리눅스마스터2급";
      case "ICTI_Q":
        return "정보통신산업기사";
      case "ICT_Q":
        return "정보통신기사";
      case "SEC_Q":
        return "정보보안기사";
      case "NET1_Q":
        return "네트워크관리사1급";
      case "NET2_Q":
        return "네트워크관리사2급";
      default:
        return category || "알 수 없음";
    }
  }

  return (
    <>
      {modalOpen && (
        <ModalBasic
          setModalOpen={setModalOpen}
          socket={sockets['room']}
          isWsOpen={isWsOpen}
          onCategorySelect={setCategory}
          
        />
      )}

      {/* ✅ 매칭 수락 모달 */}
      {showMatchModal && matchStatus === 'pending' && (
        <MatchModal
          socket={sockets['match']}
          currentUserId={user.user_id}
          setShowMatchModal={setShowMatchModal}
          setMatchStatus={setMatchStatus}
        />
      )}

      {matchStatus === 'searching' && (
      <div className={styles.matchModalBackdrop}>
        <div className={styles.matchModal}>
          <h2>🔍 매칭을 찾는 중...</h2>
          <p>상대방을 찾고 있어요. 잠시만 기다려주세요!</p>
          <button onClick={handleCancelMatch} className={styles.cancelBtn}>
            매칭 취소
          </button>
        </div>
      </div>
      )}

      {/* ✅ 상대 수락 대기 중 */}
      {matchStatus === 'waiting' && (
      <div className={styles.matchModalBackdrop}>
        <div className={styles.matchModal}>
          <h2>⏳ 상대방 수락 대기 중...</h2>
          <p>상대가 수락하면 게임이 시작됩니다.</p>
        </div>
      </div>
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
            <div
              key={index}
              className={styles.roomCard}
              onDoubleClick={() => joinRoom(room)}
            >
              <span>{room.gameroom_no}</span>
              <span className={styles.roomMode}>
                {room.game_mode === 'rank' ? 'Rank Mode' : 'Casual Mode'}
              </span>
              <span className={styles.category}>
                {setKoreanToCategory(room.category)}
              </span>
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