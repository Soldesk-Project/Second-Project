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

  useEffect(() => {
    if (!server || !user || !userNick || !userNo) return;

    const socket = sockets['server'];
    socketRef.current = socket; // 단순 참조만

    const payload = {
      action: "join",
      server,
      userNick,
      userNo,
      bgName,
      blName,
      bdName,
      titleName,
    };

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      socket.onopen = () => socket.send(JSON.stringify(payload));
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "userList" && data.server === server) {
        setUsers(data.users);
      }
    };

    socket.onerror = (e) => console.error("소켓 에러", e);

    return () => {
      setUsers([]);
    };
  }, [server, userNick, userNo, bgName, blName, bdName, titleName]);

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
