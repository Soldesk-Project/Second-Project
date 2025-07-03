import React, { useEffect, useRef, useState } from 'react';
import Header from '../layout/Header';
import Chatbox from '../layout/Chatbox';
import Test from '../components/Test';
import styles from '../css/Inplay.module.css';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const InPlay = () => {
  const [play, setPlay]=useState(false);
  const [users, setUsers] = useState([]);
  const {roomNo}=useParams();
  const socketRef=useRef(null);
  const nav=useNavigate();
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;

  useEffect(() => {
    if (!server || !userNick) return;

    // 기존 소켓 연결 종료
    if (socketRef.current) {
      socketRef.current.close();
    }

    // 새 WebSocket 연결
    socketRef.current = new WebSocket("ws://192.168.0.112:9099/ws/room"); // 경민님쪽 연결
    // socketRef.current = new WebSocket("ws://localhost:9099/ws/room"); // 테스트할때

    socketRef.current.onopen = () =>  {
      // 서버 입장 메시지 전송
      // console.log("[Client] WebSocket 연결됨, join 메시지 전송:", { action: "join", server, userNick, userNo });
      socketRef.current.send(
        JSON.stringify({ action: "join", server, userNick, userNo})
      );
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 서버별 유저 목록 수신 시
      // console.log("[Client] 서버로부터 메시지 수신:", data);
      if (data.type === "userList" && data.server === server) {
        setUsers(data.users);
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setUsers([]); // 소켓 종료 시 유저 목록 비우기
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [server, userNick, userNo]);




  const start=()=>{
    setPlay(true);
  }
  const stop=()=>{
    setPlay(false);
  }
  const leaveRoom=()=>{
    console.log(roomNo);
    
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify({
        action: "leaveRoom",
        roomNo: roomNo,
        userNick: userNick
      }));
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다.");
    }
    nav('/main/'+server);
  }



  return (
    <div className={styles.container}> {/* 공간 부터 나눴음*/}

      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      {/* <div className={styles.top_nav}><Header/></div> */}

      <div className={styles.body}>

        <div className={styles.body_left}>

          <div className={styles.solving}>
            {/* 중앙 영역 (필터, 방 리스트 등) */}
            <div className={styles.problem}>
              <button onClick={start}>시작</button>
              <button onClick={stop}>중지</button>
              {
                play?<Test/>:<h2>대기중</h2>
              }
              <button onClick={leaveRoom}>나가기</button>
            </div>

          </div>

          {/* 하단 채팅창 */}
          <div className={styles.chat_box}><Chatbox/></div>

        </div>
        {/* 우측 랭킹 목록/ 유저 목록 */}
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            {
              users.length > 0 ? (
                users.map(({ userNick, userNo }) => (
                  <div key={`user-${userNo}`} className={styles.user}>{userNick}</div>
                ))
              ) : (
                <p>현재 접속 유저가 없습니다.</p>
              )
            }
          </div>
        </div>

      </div>

    </div>
  
  );
};

export default InPlay;