import React, { useEffect, useState, useContext } from 'react';
import Test from '../../components/Test';
import styles from '../../css/Inplay.module.css';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WebSocketContext } from '../../util/WebSocketProvider';
import GameChatbox from '../../layout/GameChatbox';

const InPlay = () => {
  const [play, setPlay] = useState(false);
  const [users, setUsers] = useState([]);
  const { roomNo } = useParams();
  const nav = useNavigate();
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const location = useLocation();
  const category = location.state?.category || 'random';
  const [list, setList] = useState([]);


  // 여러 소켓을 Context로부터 받아옴
  const sockets = useContext(WebSocketContext);

  const isInitiator = users.some(u => u.userNick === userNick && u.userNo === 0);

  useEffect(() => {
    const socket = sockets['room'];
    if (!socket) return;
    
    const joinAndRequestUserList = () => {
        socket.send(JSON.stringify({ action: 'join', server, userNick }));
        socket.send(JSON.stringify({ action: 'roomUserList', server, roomNo }));
    };

    if (socket.readyState === 1) {
      joinAndRequestUserList();
    } else {
      socket.onopen = joinAndRequestUserList;
    } 

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'roomUserList' && data.server === server) {
        const formattedUsers = data.userList.map((nick, index) => ({
          userNick: nick,
          userNo: index
        }));        
        setUsers(formattedUsers);
      }
      if (data.type === 'gameStart' && data.server === server) {
        setList(data.list);
        console.log(data.list);
        
        console.log('시작한사람 ( 방장 ) : '+ data.initiator);
        
        setPlay(true);
      }
      if (data.type === 'gameStop' && data.server === server) {
        setPlay(false);
      }
    };

    socket.onclose = () => {
      setUsers([]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Provider에서 소켓을 관리하므로 여기선 cleanup 불필요
  }, [server, roomNo, sockets]);

  const start = () => {
    const socket = sockets['room'];
    
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'startGame',
        server,
        roomNo,
        userNick,
        category
    }));      
      // setPlay(true);
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - startGame');
    }
  }
  const stop = () => {
    const socket = sockets['room'];
    
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'stopGame',
        server,
        roomNo,
        userNick
      }));
      // setPlay(false);
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - stopGame');
    }
  }

  const leaveRoom = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: roomNo,
        userNick: userNick
      }));
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - leaveRoom');
    }
    nav('/main/' + server);
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.body_left}>
          <div className={styles.solving}>
            <div className={styles.problem}>
              <div className={styles.initiatorBtn}>
                <button onClick={start} disabled={!isInitiator}>시작</button>
                <button onClick={stop} disabled={!isInitiator}>중지</button>
                <button onClick={leaveRoom} className={styles.leaveBtn}>나가기</button>
              </div>
                {!isInitiator && (
                  <p className={styles.note}>방장만 게임을 시작/중지할 수 있습니다</p>
                )}
              <div className={styles.gamePlay}>
                {play ? <Test list={list} /> : <h2>대기중</h2>}
              </div>
            </div>
          </div>
          <div className={styles.chat_box}>
            {userNick && userNo !== undefined && userNo !== null && roomNo ? (
              <GameChatbox
                gameroomNo={roomNo}
                userNick={userNick}
                userNo={userNo}
              />
            ) : (
                // prop이 유효하지 않을 때 로딩 메시지 또는 에러 메시지 표시
                <p>채팅을 로드할 수 없습니다. 사용자 정보 또는 게임방 번호를 확인 중...</p>
            )}
          </div>
        </div>
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            {users.length > 0 ? (
              users.map(({ userNick, userNo }) => (
                <div key={`user-${userNo}`} className={styles.user}>
                  {userNick} / {userNo}
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
