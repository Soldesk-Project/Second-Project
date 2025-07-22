import React, { useState, useEffect, useRef, useContext } from "react";
import styles from "../css/ServerUserList.module.css";
import decoStyles from '../css/Decorations.module.css';
import { useSelector } from "react-redux";
import { WebSocketContext } from "../util/WebSocketProvider";
import titleTextMap from "../js/Decorations";

const ServerUserList = () => {
  const [users, setUsers] = useState([]); // 현재 서버에 접속한 유저 목록
  const { user, server } = useSelector((state) => state.user);
  const sockets = useContext(WebSocketContext);

  const socketRef = useRef(null);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const bgItemNo = user.backgroundItemNo;
  const blItemNo = user.balloonItemNo;
  const bdItemNo = user.boundaryItemNo;
  const titleItemNo = user.titleItemNo;
  const fontColorItemNo = user.fontcolorItemNo;
  

  useEffect(() => {
    if (!server || !user || !userNick || !userNo) return;

    const socket = sockets['server'];
    socketRef.current = socket; // 단순 참조만

    const payload = {
      action: "join",
      server,
      userNick,
      userNo,
      bgItemNo,
      blItemNo,
      bdItemNo,
      titleItemNo,
      fontColorItemNo,
    };

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      socket.onopen = () => socket.send(JSON.stringify(payload));
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "userList" && data.server === server) {
        // 1. 서버에서 유저 목록 받아옴
        const receivedUsers = data.users;

        // 2. 본인 정보 기준으로 본인을 맨 앞에 정렬
        const sortedUsers = [...receivedUsers].sort((a, b) => {
          if (a.userNo === String(userNo)) return -1; // 본인 맨 위로
          if (b.userNo === String(userNo)) return 1;
          return 0;
        });

        // 3. 상태 업데이트
        setUsers(sortedUsers);
      }
    };

    socket.onerror = (e) => console.error("소켓 에러", e);

    return () => {
      setUsers([]);
    };
  }, [server, userNick, userNo, bgItemNo, blItemNo, bdItemNo, titleItemNo, fontColorItemNo]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>{`${server}서버 - 유저 목록`}</div>
      <div className={styles.userList}>
        {
          users.length > 0 ? (
            users.map(({ userNick, userNo, bgItemNo, titleItemNo, bdItemNo, fontColorItemNo }) => (
              <div 
                key={`user-${userNo}`} 
                className={`${styles.user} ${decoStyles[bgItemNo]} ${decoStyles[bdItemNo]}`}>
                  <div>
                            {titleItemNo && titleTextMap[titleItemNo] && (
                                <span className={decoStyles[titleItemNo]} style={{marginRight: '5px', fontWeight: 'bold'}}>
                                    [{titleTextMap[titleItemNo]}]
                                </span>
                                )}
                            <span className={decoStyles[fontColorItemNo]}>
                                {userNick}
                            </span>
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
