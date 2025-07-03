import React, { useEffect, useRef, useState } from 'react';
import ModalBasic from './ModalBasic';
import styles from '../css/RoomList.module.css'; // CSS 따로 적용
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const RoomList = () => {
  // 방 인원수 0명일 때 방 삭제
  // 방 생성 후 바로 입장 되기
  // 방 헤더 없애고 나가기버튼 만들어서 인원수 나타내기

  const [gameRoomList, setGameRoomList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const socketRef=useRef(null);
  const nav=useNavigate();

  const stompRef = useRef(null);

  useEffect(() => {
    // getGameRoomList();
    if (socketRef.current) {
      socketRef.current.close();
    }

    socketRef.current = new WebSocket("ws://192.168.0.112:9099/ws/room");
    // socketRef.current = new WebSocket("ws://localhost:9099/ws/room");

    socketRef.current.onopen = () => {
      // console.log("WebSocket 연결 성공");
      setIsWsOpen(true);  // 연결 성공 상태 업데이트
      socketRef.current.send(
        JSON.stringify({ action: "join", server, userNick})
      );
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "roomList") {
        setGameRoomList(data.rooms);
      }
      if (data.type === "roomCreated") {
        socketRef.current.send(JSON.stringify({
          action: "joinRoom",
          roomNo: data.gameroom_no,
          userNick: userNick
        }));
        nav('/gameRoom/' + data.gameroom_no);
      }   
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

  }, [server, userNick]); 

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const joinRoom=(roomNo)=>{
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify({
        action: "joinRoom",
        roomNo: roomNo,
        userNick: userNick
      }));
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다.");
    }
    nav('/gameRoom/'+roomNo);
  }

  const handleQuickMatch = async () => {
    try {
      // 1. REST API로 매칭 큐 등록
      await axios.post('/api/match/join', {
        userId: user.user_id, // 백엔드에서 이걸 principal로 쓰고 있어야 함
      });

      console.log('✅ 매칭 큐 등록 완료');

      // 2. STOMP WebSocket 연결
      const sock = new SockJS('http://192.168.0.112:9099/ws-match?userId=' + user.user_id); // 경로는 WebSocketConfig 기준
      const stomp = Stomp.over(sock);

      stomp.connect({}, () => {
        console.log('✅ STOMP 연결 완료');

        // 3. 매칭 알림 구독
        stomp.subscribe('/user/queue/match', (message) => {
          const payload = message.body;

          if (payload === 'ACCEPT_MATCH') {
            console.log('✅ 수락 요청 도착!');
            // 여기에 수락 모달 띄우기 등 처리
            alert('4명이 모였습니다! 게임을 수락하시겠습니까?'); // 또는 openAcceptModal()
          }

          if (payload === 'MATCH_FOUND') {
            console.log('🎮 매칭 완료! 게임으로 이동');
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
      {modalOpen && <ModalBasic setModalOpen={setModalOpen} socket={socketRef.current} isWsOpen={isWsOpen}/>}
      <div className={styles.roomListHeader}>
        <button onClick={handleOpenModal} className={styles.createBtn}>필터</button>
        <button onClick={handleOpenModal} className={styles.createBtn}>방 생성</button>
        <button onClick={handleQuickMatch} className={styles.createBtn}>빠른매칭</button>
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
