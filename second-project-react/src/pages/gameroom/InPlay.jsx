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
  const [questionList, setQuestionList]=useState([]);
  const [question, setQuestion] = useState(null);
  const [questionId, setQuestionId] = useState(0);


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
      if (data.type === 'gameStart' && data.server === server && data.roomNo === roomNo) {
        console.log('시작한사람 ( 방장 ) : '+ data.initiator);
        if (Array.isArray(data.list) && data.list.length > 0) {
          setQuestionList(data.list);
          setQuestionId(0);
          setQuestion(data.list[0]);
          setPlay(true);
        } else {
          console.error("질문 리스트가 유효하지 않습니다.");
        }
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
  }, [server, roomNo, sockets]);

  // useEffect(() => {
  //   console.log("현재 질문:", question);
  //   console.log("질문 길이:", questionList.length);
  // }, [question, questionList]);


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


  const nextQuestion = () => {
    const nextId = questionId + 1;
    if (nextId < questionList.length) {
      setQuestion(questionList[nextId]);
      setQuestionId(nextId);
    } else {
      console.log("모든 문제를 다 풀었습니다.");
      setPlay(false); // 문제가 더 이상 없으면 게임 중지
    }
  };

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
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.body_left}>
          <div className={styles.solving}>
            <div className={styles.problem}>
              <div>
                <h2>{setKoreanToCategory(category)}</h2>
              </div>
              <div className={styles.initiatorBtn}>
                <button onClick={start} disabled={!isInitiator}>시작</button>
                <button onClick={stop} disabled={!isInitiator}>중지</button>
                <button onClick={leaveRoom} className={styles.leaveBtn}>나가기</button>
              </div>
                {!isInitiator && (
                  <p className={styles.note}>방장만 게임을 시작/중지할 수 있습니다</p>
                )}
              <div className={styles.gamePlay}>
                {play ? <Test question={question} /> : <h2>대기중</h2>}
              </div>
              <div>
                {
                  isInitiator && play && (<button onClick={nextQuestion}>다음 문제</button>)
                }

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
