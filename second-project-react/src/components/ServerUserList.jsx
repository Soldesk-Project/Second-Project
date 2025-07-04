import React, { useState, useEffect, useRef, useContext } from "react";
import styles from "../css/ServerUserList.module.css";
import decoStyles from '../css/Decorations.module.css';
import { useSelector } from "react-redux";
import { WebSocketContext } from "../util/WebSocketProvider";

const ServerUserList = () => {
  const [users, setUsers] = useState([]); // 현재 서버에 접속한 유저 목록
  const socketRef = useRef(null);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const bgName = user.background_class_name;
  const blName = user.balloon_class_name;
  const bdName = user.boundary_class_name;
  const titleName = user.title_class_name;

  const sockets = useContext(WebSocketContext);
  
  // 서버 또는 userId가 바뀔 때마다 WebSocket 연결 재설정
  useEffect(() => {
    const socket = sockets['server'];
    if (!server || !userNick) return;

    // 기존 소켓 연결 종료
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ action: "join", server, userNick, userNo, bgName, blName, bdName, titleName}));
    } else {
      socket.onopen = () => {
        socket.send(JSON.stringify({ action: "join", server, userNick, userNo, bgName, blName, bdName, titleName}));
      };
    }
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "userList" && data.server === server) {
        setUsers(data.users);
      }
    };

    socket.onclose = () => {
      // console.log("[Client] WebSocket 연결 종료");
      setUsers([]); // 소켓 종료 시 유저 목록 비우기
    };

    socket.onerror = (error) => {
      console.error("[Client] WebSocket 에러 발생:", error);
    };

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [server, userNick, userNo]);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>{`${server}서버 - 유저 목록`}</div>
      <div className={styles.userList}>
        {
          users.length > 0 ? (
            users.map(({ userNick, userNo, bgName, titleName, bdName }) => (
              <div 
                key={`user-${userNo}`} 
                className={`${styles.user} ${decoStyles[bgName]} ${decoStyles[bdName]}`}>
                  <div className={`${decoStyles[titleName]}`}>
                    {userNick}
                  </div>
              </div>
            ))
            
          ) : (
            <p>현재 접속 유저가 없습니다.</p>
          )
        }
      </div>
    </div>
  );
};

export default ServerUserList;
