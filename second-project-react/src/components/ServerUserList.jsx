import React, { useState, useEffect, useRef } from "react";
import styles from "../css/ServerUserList.module.css";
import { useSelector } from "react-redux";

const ServerUserList = () => {
  const [users, setUsers] = useState([]); // 현재 서버에 접속한 유저 목록
  const socketRef = useRef(null);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  
  
  // 서버 또는 userId가 바뀔 때마다 WebSocket 연결 재설정
  useEffect(() => {
    if (!server || !userNick) return;

    // 기존 소켓 연결 종료
    if (socketRef.current) {
      socketRef.current.close();
    }

    // 새 WebSocket 연결
    // socketRef.current = new WebSocket("ws://192.168.0.112/ws/server"); // 경민님쪽 연결
    socketRef.current = new WebSocket("ws://localhost:9099/ws/server"); // 테스트할때

    socketRef.current.onopen = () =>  {
      // 서버 입장 메시지 전송
      console.log("[Client] WebSocket 연결됨, join 메시지 전송:", { action: "join", server, userNick });
      socketRef.current.send(
        JSON.stringify({ action: "join", server, userNick})
      );
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 서버별 유저 목록 수신 시
      console.log("[Client] 서버로부터 메시지 수신:", data);
      if (data.type === "userList" && data.server === server) {
        setUsers(data.users);
        console.log(users);
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
  }, [server, userNick]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>{`${server}서버 - 유저 목록`}</div>
      <div className={styles.userList}>
        {
          users.length > 0 ? 
          (
            users.map((user) => <div key={user} className={styles.user}>{user}</div>)
          ) : (
            <p>현재 접속 유저가 없습니다.</p>
          )
        }
      </div>
    </div>
  );
};

export default ServerUserList;
