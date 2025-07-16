import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import Test from '../../components/Test';
import styles from '../../css/Inplay.module.css';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WebSocketContext } from '../../util/WebSocketProvider';
import GameChatbox from '../../components/chatbox/GameChatbox';
import ResultModal from '../../components/modal/ResultModal';

const getRankedUsers = (users, gameMode) => {
  
  console.log(gameMode);
  
  const sorted = [...users].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  let rank = 0;
  let lastScore = null;
  let realRank = 0;

  // 게임 내 재화(포인트)
  const pointsMap = { 1: 40, 2: 30, 3: 20, 4: 10 };
  // 랭크 점수
  const rankPointMap = { 1: 20, 2: 10, 3: -10, 4: -20 };

  return sorted.map((user, idx) => {
    realRank++;
    if (user.score !== lastScore) {
      rank = realRank;
      lastScore = user.score;
    }
    return {
      ...user,
      rank,
      point: pointsMap[rank] ?? 10, // 게임 내 재화
      ...(gameMode === "rank" && { rankPoint: rankPointMap[rank] ?? -20 }) // 랭크 점수
    };
  });
};
 
const InPlay = () => {
  const [play, setPlay] = useState(false);
  const [users, setUsers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [nextId, setNextId] = useState(0);
  const [time, setTime] = useState('타이머');
  const [result, setResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const questionListRef = useRef([]);
  const { roomNo } = useParams();
  const nav = useNavigate();
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const location = useLocation();
  const category = location.state?.category || 'random';
  // 랭크 진입 경로 일 때도 항상 gameMode를 제대로 받게 한다
  const gameMode = location.state?.gameMode || location.state?.game_mode || 'normal';
  const rankedUsers = useMemo(() => getRankedUsers(users, gameMode), [users, gameMode]);
  const messageTimeoutRef = useRef({});
  
  // 소켓
  const sockets = useContext(WebSocketContext);

  // 방장 여부
  const isOwner = users.some(u => u.userNick === userNick && u.isOwner);

  // 사용자별 최근 채팅 메시지를 저장할 상태
  const [userRecentChats, setUserRecentChats] = useState({});

  // GameChatbox로부터 새 메시지를 받을 콜백 함수
  const handleNewChatMessage = useCallback((chatMessage) => {
    if (chatMessage.mSender && chatMessage.mContent) {
      //1. 새로운 내용으로 말풍선 업데이트
      setUserRecentChats(prev => ({
        ...prev,
        [chatMessage.mSender]: {
          message: chatMessage.mContent,
          timestamp: chatMessage.mTimestamp
        }
      }));

      //2. 기존 타이머 취소
      if (messageTimeoutRef.current[chatMessage.mSender]) {
        clearTimeout(messageTimeoutRef.current[chatMessage.mSender]);
      }

      // 3. 새로운 타이머 설정
      const timerId = setTimeout(() => {
        setUserRecentChats(prev => {
          const newState = { ...prev };
          // ⭐ 중요: 타이머가 만료될 때, 해당 메시지가 여전히 해당 유저의 최신 메시지인지 확인
          // (그 사이에 같은 유저가 다른 메시지를 보내면 이전 메시지를 지우지 않음)
          if (newState[chatMessage.mSender] && newState[chatMessage.mSender].timestamp === chatMessage.mTimestamp) {
            delete newState[chatMessage.mSender];
          }
          return newState;
        });
        // 타이머가 실행된 후에는 ref에서도 해당 타이머 ID 제거
        delete messageTimeoutRef.current[chatMessage.mSender]; 
      }, 5000); // 마지막 메시지 출력 후 5초 뒤에 사라짐

      // 4. 새로 설정된 타이머 ID를 useRef에 저장
      messageTimeoutRef.current[chatMessage.mSender] = timerId;
    }
  }, []);

  // 문제 데이터
  useEffect(() => {
    const socket = sockets['room'];
    if (!socket) return;

    const joinAndRequestUserList = () => {
      socket.send(JSON.stringify({ action: 'join', server, userNick }));
      socket.send(JSON.stringify({ action: 'roomUserList', server: gameMode === 'rank' ? 'rank' : server, roomNo }));
    };

    if (socket.readyState === 1) {
      joinAndRequestUserList();
    } else {
      socket.onopen = joinAndRequestUserList;
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // ✅ 유저리스트(랭크 & 일반) 모두 처리
      if (
        data.type === 'roomUserList' && data.roomNo === roomNo &&
        (
          data.server === server ||
          (gameMode === 'rank' && data.server === 'rank')
        )
      ) {
        const ownerNick = data.owner;
        const formattedUsers = data.userList.map((nick, no) => ({
          userNick: nick,
          userNo: no,
          isOwner: nick === ownerNick
        }));
        
        setUsers(formattedUsers);
      }

      if (
        data.type === 'gameStart' &&
        data.roomNo === roomNo &&
        (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      ) {
        if (Array.isArray(data.list) && data.list.length > 0) {
          setNextId(0);
          questionListRef.current = data.list;
          setQuestion(data.list[0]);
          setPlay(true);
          setResult(false);
          setUsers(users => users.map(u => ({
            ...u,
            score: 0})));
          setTime(5);
        } else {
          console.error("질문 리스트가 유효하지 않습니다. 데이터:", data.list);
        }
      }

      if (
        data.type === 'gameStop' &&
        (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      ) {
        setPlay(false);
        setTime('타이머');
      }

      if (data.type === 'checkAnswerAndNextQuestion' &&
        data.roomNo === roomNo &&
        (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      ) {
        if (data.scores) {
          setUsers(users => users.map(u => ({
            ...u,
            score: data.scores[u.userNick] ?? u.score
          })));
        }

        console.log("다음 문제 Id : "+data.nextId);
        
        if (data.nextId !== null) {
          const nextId = Number(data.nextId);
          setNextId(nextId);
  
          if (questionListRef.current.length === 0) {
            console.error("questionListRef가 비어 있습니다.");
            return;
          }
          if (nextId < questionListRef.current.length) {
            setQuestion({ ...questionListRef.current[nextId] });
            setTime(6);
          } else {
            setPlay(false);
            setResult(true);
            setTime('타이머');
          }
          
        }
        
        


      }


      // if (
      //   data.type === 'nextQuestion' &&
      //   data.roomNo === roomNo &&
      //   (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      // ) {
      //   const nextId = Number(data.nextId);
      //   setNextId(nextId);

      //   if (questionListRef.current.length === 0) {
      //     console.error("questionListRef가 비어 있습니다.");
      //     return;
      //   }

      //   if (nextId < questionListRef.current.length) {
      //     setQuestion({ ...questionListRef.current[nextId] });
      //   } else {
      //     setPlay(false);
      //     setResult(true);
      //     setTime('타이머');
      //   }
      // }

      // if (
      //   data.type === 'sumScore' &&
      //   data.roomNo === roomNo &&
      //   (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      // ) {
      //   if (data.scores) {
      //     setUsers(users => users.map(u => ({
      //       ...u,
      //       score: data.scores[u.userNick] ?? u.score
      //     })));
      //   }
      // }
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
  }, [server, roomNo, sockets, userNick, gameMode]);

  // 문제 풀이 타이머
  useEffect(() => {
    if (play) {
      const timer = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);

      if (time <= 0) {
        // 요청 시점만 로그
        //console.log(`[${userNick}] nextQuestion 요청 보냄 at ${new Date().toLocaleTimeString()}`);

        handleAnswerSubmit(selectedAnswer);
      }

      return () => clearInterval(timer,);
    }
  }, [time, play]);

  // 정답 판단
  const handleAnswerSubmit = (answer) => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'checkAnswer',
        server,
        roomNo,
        userNick,
        answer,
        game_mode: gameMode
      }));
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - checkAnswer');
    } 
    setTime(6);    
    setSelectedAnswer(null);
  };
  // const handleAnswerSubmit = (answer, targetQuestion) => {

  //   console.log(`[${userNick}] 정답 판정! 선택 답: ${answer} (정답: ${targetQuestion?.correct_answer}) at ${new Date().toLocaleTimeString()}`);
  //   const isCorrect = targetQuestion  && targetQuestion.correct_answer === parseInt(answer);
  //   const socket = sockets['room'];
  //   if (isCorrect){
  //     if (socket && socket.readyState === 1) {
  //       socket.send(JSON.stringify({
  //         action: 'sumScore',
  //         server,
  //         roomNo,
  //         userNick,
  //         game_mode: gameMode
  //       }));
  //     } else {
  //       alert('웹소켓 연결이 준비되지 않았습니다 - score');
  //     } 
  //   }
  //   if (socket && socket.readyState === 1) {
  //     socket.send(JSON.stringify({
  //       action: 'nextQuestion',
  //       server,
  //       roomNo,
  //       userNick,
  //       game_mode: gameMode
  //     }));
  //     setTime(6);    
  //   } else {
  //     alert('웹소켓 연결이 준비되지 않았습니다 - nextQuestion');
  //   }
  //   setSelectedAnswer(null);
  // };

  // 시작 버튼
  const start = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'startGame',
        server,
        roomNo,
        userNick,
        category,
        game_mode: gameMode
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
                <span>{setKoreanToCategory(category)}</span>
                <span className={styles.timer}>{time}</span>
              </div>
              <div className={styles.initiatorBtn}>
                {
                  (play||result)?(
                    <>
                      <button onClick={start} disabled={true}>시작</button>
                      <button onClick={stop} disabled={true}>중지</button>
                      <button onClick={leaveRoom} className={styles.leaveBtn} disabled={true}>나가기</button>
                    </>
                  ):(
                    <>  
                      <button onClick={start} disabled={!isOwner}>시작</button>
                      <button onClick={stop} disabled={!isOwner}>중지</button>
                      <button onClick={leaveRoom} className={styles.leaveBtn}>나가기</button>
                    </>
                  )
                }
              </div>
              {!isOwner && ( !play && 
                <p className={styles.note}>방장만 게임을 시작/중지할 수 있습니다</p>)
              }
              <div className={styles.gamePlay}>
                {
                  play ? 
                  <Test question={question} 
                        nextId={nextId}
                        onSelectAnswer={setSelectedAnswer} // 추가!
                        selectedAnswer={selectedAnswer}/> : 
                  <h2>대기중</h2>
                }
              </div>
              <button onClick={()=>setResult(true)}>결과창확인</button>
            </div>
          </div>
          <div className={styles.chat_box}>
            {userNick && userNo != null && roomNo ? (
              <GameChatbox gameroomNo={roomNo} userNick={userNick} userNo={userNo} onNewMessage={handleNewChatMessage}/>
            ) : (
              <p>채팅을 로드할 수 없습니다. 사용자 정보 또는 게임방 번호를 확인 중...</p>
            )}
          </div>
        </div>
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            {users.length > 0 ? (
              users.slice(0, 4).map(({ userNick, userNo, isOwner, score }) => (
                <div key={userNo} className={styles.user_card}>
                  <div className={styles.role_badge}>{isOwner ? '방장' : '유저'}</div>
                  <div className={styles.user_info}>
                    <span className={styles.nick}>{userNick}</span>
                    <span className={styles.score}>점수: {score ?? 0}</span>
                  </div>
                  {userRecentChats[userNick] && (
                    <div className={styles.chatBubble}>
                      {userRecentChats[userNick].message}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>현재 접속 유저가 없습니다.</p>
            )}
          </div>
        </div>
        {
          result &&
            <ResultModal users={rankedUsers}
              setResult={setResult}
              gameMode={gameMode}/>
        }
      </div>
    </div>
  );
};

export default InPlay;