import React, { useEffect, useState, useContext } from 'react';
import Chatbox from '../layout/Chatbox';
import Test from '../components/Test';
import styles from '../css/Inplay.module.css';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { WebSocketContext } from '../util/WebSocketProvider';

const InPlay = () => {
  const [play, setPlay] = useState(false);
  const [users, setUsers] = useState([]);
  const { roomNo } = useParams();
  const nav = useNavigate();
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;

  // 여러 소켓을 Context로부터 받아옴
  const sockets = useContext(WebSocketContext);

  useEffect(() => {
    const socket = sockets['room'];
    if (!socket) return;

    // 이미 연결된 경우 바로 join, 아니면 onopen에서 join
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ action: 'join', server, userNick, userNo }));
    } else {
      socket.onopen = () => {
        socket.send(JSON.stringify({ action: 'join', server, userNick, userNo }));
      };
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'userList' && data.server === server) {
        setUsers(data.users);
      }
    };

    socket.onclose = () => {
      setUsers([]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Provider에서 소켓을 관리하므로 여기선 cleanup 불필요
  }, [server, userNick, userNo, sockets]);

  const start = () => setPlay(true);
  const stop = () => setPlay(false);

  const leaveRoom = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: roomNo,
        userNick: userNick
      }));
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다.');
    }
    nav('/main/' + server);
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.body_left}>
          <div className={styles.solving}>
            <div className={styles.problem}>
              <button onClick={start}>시작</button>
              <button onClick={stop}>중지</button>
              {play ? <Test /> : <h2>대기중</h2>}
              <button onClick={leaveRoom}>나가기</button>
            </div>
          </div>
          <div className={styles.chat_box}>
            <Chatbox />
          </div>
        </div>
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            {users.length > 0 ? (
              users.map(({ userNick, userNo }) => (
                <div key={`user-${userNo}`} className={styles.user}>
                  {userNick}
                </div>
              ))
            ) : (
              <p>현재 접속 유저가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InPlay;
