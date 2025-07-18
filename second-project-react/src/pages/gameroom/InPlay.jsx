import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import Test from '../../components/Test';
import styles from '../../css/Inplay.module.css';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WebSocketContext } from '../../util/WebSocketProvider';
import GameChatbox from '../../components/chatbox/GameChatbox';
import ResultModal from '../../components/modal/ResultModal';

const getRankedUsers = (users, gameMode) => {
  const sorted = [...users].sort((a, b) => {
    // 1. 점수 높은 순
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    // 2. 점수 같으면 누적 시간 적은 순 (빠른 사람이 이김)
    const elapsedA = typeof a.elapsedTime === "number" ? a.elapsedTime : Infinity;
    const elapsedB = typeof b.elapsedTime === "number" ? b.elapsedTime : Infinity;
    return elapsedA - elapsedB;
  });

  let rank = 0;
  let lastScore = null;
  let lastElapsed = null;
  let realRank = 0;

  // 게임 내 재화(포인트)
  const pointsMap = { 1: 40, 2: 30, 3: 20, 4: 10 };
  // 랭크 점수
  const rankPointMap = { 1: 20, 2: 10, 3: -10, 4: -20 };

  return sorted.map((user, idx) => {
    realRank++;
    // **동점 && 누적시간까지 같을 때만 공동순위!**
    if (user.score !== lastScore || user.elapsedTime !== lastElapsed) {
      rank = realRank;
      lastScore = user.score;
      lastElapsed = user.elapsedTime;
    }
    return {
      ...user,
      rank,
      point: pointsMap[rank] ?? 10,
      ...(gameMode === "rank" && { rankPoint: rankPointMap[rank] ?? -20 })
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
  const [userAnswerHistory, setUserAnswerHistory] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [userElapsedTimes, setUserElapsedTimes] = useState([]);
  const myTotalElapsed = userElapsedTimes.reduce((sum, t) => sum + t, 0);
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

  // 제출 버튼 클릭 시 수정 불가
  // [제출 버튼]
  const handleSubmit = () => {
    if (questionStartTime) {
      const spentTimeSec = ((Date.now() - questionStartTime) / 1000).toFixed(3);
      setUserElapsedTimes(prev => [...prev, Number(spentTimeSec)]);
      handleAnswerSubmit(selectedAnswer, spentTimeSec);
      setSubmitted(true);
    }
  }

  useEffect(() => {
    setSubmitted(false);
    setSelectedAnswer(null);
  }, [nextId]);

  // [문제 시작/넘어갈 때] 소요 시간 계산
  useEffect(() => {
    if (play) setQuestionStartTime(Date.now());
  }, [nextId, play]);

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
          // 타이머가 만료될 때, 해당 메시지가 여전히 해당 유저의 최신 메시지인지 확인
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
      console.log(data);
      
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
        console.log(data.list);
        
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

      if (
        data.type === 'nextQuestion' &&
        data.roomNo === roomNo &&
        (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      ) {
        const nextId = Number(data.nextId);
        setNextId(nextId);
        setTime(1);

        if (questionListRef.current.length === 0) {
          console.error("questionListRef가 비어 있습니다.");
          return;
        }

        if (nextId < questionListRef.current.length) {
          setQuestion({ ...questionListRef.current[nextId] });
        } else {
          setPlay(false);
          setResult(true);
          setTime('타이머');
        }
      }

      if (
        data.type === 'sumScore' &&
        data.roomNo === roomNo &&
        (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      ) {
        if (data.scores) {
          setUsers(users => users.map(u => ({
            ...u,
            score: data.scores[u.userNick] ?? u.score,
            elapsedTime: data.elapsedTimes ? data.elapsedTimes[u.userNick] ?? u.elapsedTime : u.elapsedTime
          })));
        }
        setUserAnswerHistory(prev=>[...prev, 
          {
            userNick: data.userNick,
            question_id: questionListRef.current[data.questionIdx].id,
            subject: setKoreanToCategory(questionListRef.current[data.questionIdx].subject),
            selected_answer: data.answer,
            correct_answer: data.correctAnswer,
            is_correct: data.isCorrect,
            submitted_at: data.isCorrect,
          }
        ])
        // console.log("-----------------");
        // console.log("userNick : "+data.userNick);
        // console.log("isCorrect : "+data.isCorrect);
        // console.log("answer : "+data.answer);
        // console.log("correctAnswer : "+data.correctAnswer);
        // console.log("question : "+data.questionIdx);
        // console.log("question : "+questionListRef.current[data.questionIdx].id);
        // console.log("question : "+setKoreanToCategory(questionListRef.current[data.questionIdx].subject));
        // console.log("question : "+questionListRef.current[data.questionIdx].question_text);
        // console.log("question : "+questionListRef.current[data.questionIdx].correct_answer);
        

      }

      // if (data.type === 'joinDenied') {
      //   alert(data.reason);
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
    if (play && typeof time === "number" && time > 0) {
      const timer = setInterval(() => {
        setTime(prev => {
          // 1 이하에서 멈추게
          if (prev <= 1) {
            clearInterval(timer); // 이거는 혹시 모를 race condition용. (불필요할 수도)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // cleanup: 컴포넌트 언마운트/문제 전환/플레이 중지 시 interval 해제
      return () => clearInterval(timer);
    }

    // 타이머가 0이 되면 자동 제출(한 번만)
    if (play && typeof time === "number" && time === 0) {
      const spentTimeSec = 10;
      handleAnswerSubmit(selectedAnswer, spentTimeSec);
      //setPlay(false);
    }

    // 결과 전송
    if (!play && result) {
      const socket = sockets['room'];
      if (socket && socket.readyState === 1) {
        const myInfo = rankedUsers.find(u => u.userNick === userNick);
        console.log(myInfo);
        
        const myPoint = myInfo.point ?? 0;
        console.log(userAnswerHistory);
        socket.send(JSON.stringify({
          action: 'rewardPointsAndSaveUserHistory',
          server,
          roomNo,
          userNick,
          point: myPoint,
          // history: userAnswerHistory
        }));
      } else {
        alert('웹소켓 연결이 준비되지 않았습니다 - rewardPoints');
      }
    }
  }, [play, time, result]);

  // 정답 판단
  const handleAnswerSubmit = (answer, spentTimeSec) => {
    
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'submitAnswer',  // or 'checkAnswer' 등 서버에 맞춰서!
        server,
        roomNo,
        userNick,
        answer, // 내가 선택한 답 번호만 보냄!
        questionIndex: nextId, // 현재 문제 번호
        spentTime: spentTimeSec, // 소요시간 서버에 전달
        game_mode: gameMode
      }));
    } else {
      alert('웹소켓 연결이 준비되지 않았습니다 - answer');
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
      case "LM1_Q": return "리눅스마스터 1급";
      case "LM2_Q": return "리눅스마스터 2급";
      case "ICTI_Q": return "정보통신산업기사";
      case "ICT_Q": return "정보통신기사";
      case "SEC_Q": return "정보보안기사";
      case "NET1_Q": return "네트워크관리사 1급";
      case "NET2_Q": return "네트워크관리사 2급";
      case "정보처리기사": return "CPE_Q";
      case "정보처리산업기사": return "CPEI_Q";
      case "정보처리기능사": return "CPET_Q";
      case "리눅스마스터 1급": return "LM1_Q";
      case "리눅스마스터 2급": return "LM2_Q";
      case "정보통신산업기사": return "ICTI_Q";
      case "정보통신기사": return "ICT_Q";
      case "정보보안기사": return "SEC_Q";
      case "네트워크관리사 1급": return "NET1_Q";
      case "네트워크관리사 2급": return "NET2_Q";
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
                        selectedAnswer={selectedAnswer}
                        submitted={submitted}/> : 
                  <h2>대기중</h2>
                }
              </div>
              <button onClick={handleSubmit} disabled={submitted || selectedAnswer === null}>제출</button>
              <button onClick={()=>setResult(true)}>결과창확인</button>
            </div>
          </div>
          <div className={styles.chat_box}>
            {userNick && userNo != null && roomNo ? (
              <GameChatbox gameroomNo={roomNo} userNick={userNick} userNo={userNo} onNewMessage={handleNewChatMessage} currentUser={user}/>
            ) : (
              <p>채팅을 로드할 수 없습니다. 사용자 정보 또는 게임방 번호를 확인 중...</p>
            )}
          </div>
        </div>
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            {users.length > 0 ? (
              users.slice(0, 4).map(({ userNick: nick, userNo, isOwner, score, elapsedTime }) => (
                <div key={userNo} className={styles.user_card}>
                  <div className={styles.role_badge}>{isOwner ? '방장' : '유저'}</div>  
                  <div className={styles.user_info}>
                    <span className={styles.nick}>{nick}</span>
                    <span className={styles.score}>점수: {score ?? 0}</span>
                    <span className={styles.score}>
                      시간: {typeof elapsedTime === 'number' ? elapsedTime.toFixed(3) + "초" : "-"}
                    </span>
                  </div>
                  {userRecentChats[nick] && (
                    <div className={styles.chatBubble}>
                      {userRecentChats[nick].message}
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
              gameMode={gameMode}
              myElapsedTimes={userElapsedTimes}
              myTotalElapsed={myTotalElapsed}/>
        }
      </div>
    </div>
  );
};

export default InPlay;