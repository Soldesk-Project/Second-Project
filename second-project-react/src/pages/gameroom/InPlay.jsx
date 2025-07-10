import React, { useEffect, useState, useContext, useRef } from 'react';
import Test from '../../components/Test';
import styles from '../../css/Inplay.module.css';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WebSocketContext } from '../../util/WebSocketProvider';
import GameChatbox from '../../components/chatbox/GameChatbox';

const InPlay = () => {
  const [play, setPlay] = useState(false);
  const [users, setUsers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [nextId, setNextId] = useState(0);
  const [time, setTime] = useState('타이머');
  const [score, setScore] = useState(0);
  const [isTimeOver, setIsTimeOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const questionListRef = useRef([]);
  const { roomNo } = useParams();
  const nav = useNavigate();
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const location = useLocation();
  const category = location.state?.category || 'random';
  
  // 소켓
  const sockets = useContext(WebSocketContext);

  // 방장
  const isInitiator = users.some(u => u.userNick === userNick && u.userNo === 0);

  // 문제 데이터
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
        // console.log('방장 :', data.initiator);
        // console.log('id :', data.nextId);
        if (Array.isArray(data.list) && data.list.length > 0) {
          setNextId(0);
          questionListRef.current = data.list;
          setQuestion(data.list[data.nextId]);
          setPlay(true);
          setScore(0);
          setTime(5);
        } else {
            console.error("질문 리스트가 유효하지 않습니다. 데이터:", data.list);
        }
      }

      if (data.type === 'gameStop' && data.server === server) {
        setPlay(false);
        setTime('타이머');
      }

      if (data.type === 'nextQuestion' && data.server === server && data.roomNo === roomNo) {
        const nextId = Number(data.nextId);
        setNextId(data.nextId);
        setIsTimeOver(false);
        // console.log("nextId:", nextId);
        // console.log("questionListRef 길이:", questionListRef.current.length);

        if (questionListRef.current.length === 0) {
          console.error("questionListRef가 비어 있습니다.");
          return;
        }

        if (nextId < questionListRef.current.length) {
          setQuestion({ ...questionListRef.current[nextId] });
        } else {
          console.log("모든 문제를 다 풀었습니다.");
          setPlay(false);
          setTime('타이머');
        }
      }

      if (data.type === 'sumScore' && data.server === server && data.roomNo === roomNo) {
        if (data.scores) {
          setUsers(users => users.map(u => ({
            ...u,
            score: data.scores[u.userNick] ?? u.score
          })));
          setScore(data.scores[userNick] ?? score); // 내 점수 별도 관리도 가능
        }
      }
    };

    socket.onclose = () => {
      setUsers([]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.onmessage = null;
    };
  }, [server, roomNo, sockets, userNick]);


  // 문제 풀이 타이머
  useEffect(() => {
    if (play) {
      const timer = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);
      if(time <= 0) {
        handleAnswerSubmit(selectedAnswer);
        setIsTimeOver(true);
        const socket = sockets['room'];
        if (socket && socket.readyState === 1) {
          socket.send(JSON.stringify({
            action: 'nextQuestion',
            server,
            roomNo,
            userNick
          }));
        } else {
          alert('웹소켓 연결이 준비되지 않았습니다 - nextQuestion');
        }
        setTime(6);
      }
      return () => clearInterval(timer);
    }
  }, [time, play]);

  // 정답 판단
  const handleAnswerSubmit = (answer) => {
    const isCorrect = question.correct_answer === parseInt(answer);
    // console.log("answer : "+answer);
    // console.log("isCorrect : "+isCorrect);
    
    if (isCorrect){
      // setScore(prev => prev + 1);
      // console.log("score : "+score);
      
      const socket = sockets['room'];
      if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify({
          action: 'sumScore',
          server,
          roomNo,
          userNick
        }));
      } else {
        alert('웹소켓 연결이 준비되지 않았습니다 - score');
      }
    }
    setSelectedAnswer(null);
  };


  // 시작 버튼
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
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - startGame');
    }
  };

  // 중지 버튼 (삭제 예정)
  const stop = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'stopGame',
        server,
        roomNo,
        userNick
      }));
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - stopGame');
    }
  };

  // 나가기 버튼 (플레이 중 불가)
  const leaveRoom = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: roomNo,
        userNick: userNick
      }));
    }
    nav('/main/' + server);
  };

  // 카테고리 변환
  const setKoreanToCategory = (category) => {
    switch (category) {
      case "random": return "랜덤";
      case "CPE_Q": return "정보처리기사";
      case "CPEI_Q": return "정보처리산업기사";
      case "CPET_Q": return "정보처리기능사";
      case "LM1_Q": return "리눅스마스터1급";
      case "LM2_Q": return "리눅스마스터2급";
      case "ICTI_Q": return "정보통신산업기사";
      case "ICT_Q": return "정보통신기사";
      case "SEC_Q": return "정보보안기사";
      case "NET1_Q": return "네트워크관리사1급";
      case "NET2_Q": return "네트워크관리사2급";
      default: return category || "알 수 없음";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.body_left}>
          <div className={styles.solving}>
            <div className={styles.problem}>
              <div className={styles.testHeader}>
                <span>{setKoreanToCategory(category)}</span><span className={styles.timer}>{time}</span>
              </div>
              <div className={styles.initiatorBtn}>
                {
                  play?(
                    <>
                      <button onClick={start} disabled={true}>시작</button>
                      <button onClick={stop} disabled={true}>중지</button>
                      <button onClick={leaveRoom} className={styles.leaveBtn} disabled={true}>나가기</button>
                    </>
                  ):(
                    <>
                      <button onClick={start} disabled={!isInitiator}>시작</button>
                      <button onClick={stop} disabled={!isInitiator}>중지</button>
                      <button onClick={leaveRoom} className={styles.leaveBtn}>나가기</button>
                    </>
                  )
                }
              </div>
              {!isInitiator && ( !play &&
                <p className={styles.note}>방장만 게임을 시작/중지할 수 있습니다</p>
              )}
              <div className={styles.gamePlay}>
                {play ? 
                <Test question={question} 
                      nextId={nextId}
                      onSubmit={handleAnswerSubmit}
                      onSelectAnswer={setSelectedAnswer} // 추가!
                      selectedAnswer={selectedAnswer} 
                      disabled={isTimeOver}/> : <h2>대기중</h2>}
              </div>
            </div>
          </div>
          <div className={styles.chat_box}>
            {userNick && userNo != null && roomNo ? (
              <GameChatbox gameroomNo={roomNo} userNick={userNick} userNo={userNo} />
            ) : (
              <p>채팅을 로드할 수 없습니다. 사용자 정보 또는 게임방 번호를 확인 중...</p>
            )}
          </div>
        </div>
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            {users.length > 0 ? (
              users.map(({ userNick, userNo, score }) => (
                <div key={`user-${userNo}`} className={styles.user}>
                  <p>{userNick} / 번호 : {userNo==0?'방장':userNo} / 점수 : {score}</p>
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
