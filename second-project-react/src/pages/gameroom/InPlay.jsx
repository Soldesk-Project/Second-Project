import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import Test from '../../components/Test';
import styles from '../../css/Inplay.module.css';
import decoStyles from '../../css/Decorations.module.css';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WebSocketContext } from '../../util/WebSocketProvider';
import GameChatbox from '../../components/chatbox/GameChatbox';
import ResultModal from '../../components/modal/ResultModal';
import LeaveModal from '../../components/modal/LeaveModal';
import axios from 'axios';

// 순위 계산 및 포인트 지급
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
  const [time, setTime] = useState('30');
  const [result, setResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswerHistory, setUserAnswerHistory] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [userElapsedTimes, setUserElapsedTimes] = useState([]);
  const [countdown, setCountdown] = useState(10);
  const [leaveModal, setLeaveModal] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [date, setDate] = useState(()=> new Date())
  const myTotalElapsed = userElapsedTimes.reduce((sum, t) => sum + t, 0);
  const questionListRef = useRef([]);
  const { roomNo } = useParams();
  const nav = useNavigate();
  const { user, server } = useSelector((state) => state.user);
  const userNick = user?.user_nick;
  const userNo = user?.user_no;
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

  // 상점 아이템 목록 가져오기(유저 프로필 아이템 랜더링)
  const itemMap = React.useMemo(() => {
    return shopItems.reduce((m, it) => {
      m[it.item_no] = it;
      return m;
    }, {});
  }, [shopItems]);

	 // 🆕 useEffect: 샵 전체 아이템 한 번만 불러오기
  useEffect(() => {
    const cats = ['테두리','칭호','글자색','명함','말풍선', '유니크'];
    Promise.all(cats.map(cat =>
      axios.get(`/api/shop/items?category=${encodeURIComponent(cat)}`)
    ))
    .then(results => {
      const all = results.flatMap(r =>
        r.data.map(it => ({
          ...it,
          imgUrl: it.imageFileName ? `/images/${it.imageFileName}` : ''
        }))
      );
      setShopItems(all);
    })
    .catch(err => console.error('샵 아이템 로드 실패', err));
  }, []);
  
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
      }, 10000000000); // 마지막 메시지 출력 후 5초 뒤에 사라짐

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
      socket.send(JSON.stringify({ action: 'roomUserList', 
                                   server: gameMode === 'rank' ? 'rank' : server, 
                                   roomNo, 
                                   userNo 
                                }));
    };

    if (socket.readyState === 1) {
      joinAndRequestUserList();
    } else {
      socket.onopen = joinAndRequestUserList;
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log(data);
      
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
        
       if (data.profiles) {
          setUserProfiles(prev => ({
            ...prev,
            ...data.profiles
          }));
        }

        console.log(data.profiles);
        
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
          setUserAnswerHistory([]);
          setPlay(true);
          setResult(false);
          setUsers(users => users.map(u => ({
            ...u,
            score: 0,
            elapsedTime: 0
          })));
          setTime(5);
          setUserElapsedTimes([])
        } else {
          console.error("질문 리스트가 유효하지 않습니다. 데이터:", data.list);
        }
      }

      if (
        data.type === 'gameStop' &&
        (gameMode === 'rank' ? data.server === 'rank' : data.server === server)
      ) {
        setPlay(false);
        setTime('30');
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
          setTime('30');
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
        if (data.userNick === userNick) {
          setUserAnswerHistory(prev=>[...prev, 
            {
              userNick: data.userNick,
              question_id: questionListRef.current[data.questionIdx].id,
              subject: questionListRef.current[data.questionIdx].subject,
              selected_answer: data.answer,
              correct_answer: data.correctAnswer,
              is_correct: data.isCorrect,
              submitted_at: new Date().toISOString()
            }
          ])
          
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
  }, [server, roomNo, sockets, userNick, gameMode]);

  // 문제 풀이 타이머
  useEffect(() => {
    if (play && typeof time === "number" && time > 0) {
      const timer = setInterval(() => {
        setTime(prev => {
          // 1 이하에서 멈추게
          if (prev <= 1) {
            clearInterval(timer);
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
      const spentTimeSec = 30;
      handleAnswerSubmit(selectedAnswer, spentTimeSec);
      //setPlay(false);
    }

    // 결과 전송
    if (!play && result) {
      const socket = sockets['room'];
      if (socket && socket.readyState === 1) {
        const myInfo = rankedUsers.find(u => u.userNick === userNick);
        const myPoint = myInfo.point ?? 0;
        const rankPoint = myInfo.rankPoint ?? 0;
        const myRank = myInfo.rank ?? 0;

        socket.send(JSON.stringify({
          action: 'rewardPointsAndSaveUserHistory',
          server,
          roomNo,
          userNick,
          gameMode: gameMode,
          point: myPoint,
          rankPoint: rankPoint,
          myRank: myRank,
          history: userAnswerHistory
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
        action: 'submitAnswer',
        server,
        roomNo,
        userNick,
        answer, 
        questionIndex: nextId,
        spentTime: spentTimeSec,
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

  useEffect(() => {
    if (gameMode === 'rank') {
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // cleanup
    }
  }, [gameMode]);

  const openLeaveModal = () => {
    setLeaveModal(true)
  }

  // 나가기 버튼 (플레이 중 불가)
  const leaveRoom = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: roomNo,
        userNick: userNick,
        gameMode: gameMode
      }));
    }
    setLeaveModal(false);
    nav('/main/' + server);
  };

   useEffect(()=>{
    const timeId = setInterval(()=>setDate(new Date()),1000)
    console.log('setInteval')

    return() =>{
      clearInterval(timeId)
      console.log('clearInterval')

    }
  },[])

  // 카테고리 변환
  const setKoreanToCategory = (category) => {
    switch (category) {
      case "random": return "랜덤";
      case "cpe": return "정보처리기사";
      case "cpei": return "정보처리산업기사";
      case "cpet": return "정보처리기능사";
      case "lm1": return "리눅스마스터 1급";
      case "lm2": return "리눅스마스터 2급";
      case "icti": return "정보통신산업기사";
      case "ict": return "정보통신기사";
      case "sec": return "정보보안기사";
      case "net1": return "네트워크관리사 1급";
      case "net2": return "네트워크관리사 2급";
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
                <span className={`${styles.timer} ${Number(time) <= 3 ? styles.urgent : ''}`}>
                  {time}초
                </span>
              </div>
              <div className={styles.initiatorBtn}>
                {
                  gameMode === 'rank' ? (
                    // 랭크 모드에서는 시작 버튼 없음
                    <button onClick={openLeaveModal} className={styles.leaveBtn}>나가기</button>
                  ) : (
                    (play || result) ? (
                      <>
                        <button onClick={start} disabled={true}>시작</button>
                        <button onClick={openLeaveModal} className={styles.leaveBtn}>나가기</button>
                      </>
                    ) : (
                      <>
                        <button onClick={start} disabled={!isOwner}>시작</button>
                        <button onClick={openLeaveModal} className={styles.leaveBtn}>나가기</button>
                      </>
                    )
                  )
                }
              </div>
              {!isOwner && ( !play && 
                <p className={styles.note}>방장만 게임을 시작/중지할 수 있습니다</p>)
              }
              <div className={styles.gamePlay}>
                {
                  play ? (
                    <Test 
                      question={question} 
                      nextId={nextId}
                      onSelectAnswer={setSelectedAnswer}
                      selectedAnswer={selectedAnswer}
                      submitted={submitted}
                    />
                  ) : (
                    gameMode === 'rank' ? (
                      <h2 className={styles.countdown}>랭크 게임이 {countdown}초 후 시작됩니다...</h2>
                    ) : (
                      <h2>대기중</h2>
                    )
                  )
                }
              </div>
              <button onClick={handleSubmit} disabled={submitted || selectedAnswer === null}>제출</button>
              {/* <button onClick={()=>setResult(true)}>결과창확인</button> */}
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
          {Array.from({ length: 4 }).map((_, i) => {
            const user = users[i];  // 없는 인덱스면 undefined
            const profile = userProfiles[user?.userNick];

            return user ? (
              <div
                key={user.userNo}
                className={styles.user_card}
                style={(() => {
                  if (!profile || !itemMap) return {};
                  const bg = itemMap[profile.backgroundItemNo];
                  if (!bg || !bg.imgUrl) return {};
                  return {
                    borderStyle: 'solid',
                    borderWidth: '10px',
                    borderImageSource: `url(${bg.imgUrl})`,
                    borderImageSlice: 10,
                    borderImageRepeat: 'stretch',
                  };
                })()}
              >
                {/* 방장/유저 뱃지 */}
                <div className={styles.role_badge}>
                  {user.isOwner ? '방장' : '유저'}
                </div>

                {/* 좌측 프로필 + 우측 닉네임/랭크/칭호 */}
                <div className={styles.profileRow}>
                  {profile && (
                    <div className={styles.profileImageWrapper}>
                      <img
                        src={`/images/${profile.imageFileName}`}
                        onError={(e) => { e.target.src = "/images/defaultProfileBoarder.png"; }}
                        className={styles.borderImage}
                      />
                      <img
                        src={profile.user_profile_img}
                        onError={(e) => { e.target.src = "/images/profile_default.png"; }}
                        className={styles.profileImage}
                      />
                    </div>
                  )}

                  <div className={styles.user_info}>
                    <div className={styles.userTopInfo}>
                      {/* 여기서 fc 선언 후 사용 */}
                      {(() => {
                        const fontcolor = profile && itemMap ? itemMap[profile.fontColorItemNo] : null;
                        
                        return (
                          <span className={`${styles.nick} ${fontcolor ? decoStyles[fontcolor.css_class_name] : ''}`}>
                            {user.userNick}
                          </span>
                        );
                      })()}

                      {profile && (() => {
                        const title = itemMap ? itemMap[profile.titleItemNo] : null;
                        return (
                          <>
                            <span className={styles.rank}>랭크: {profile.user_rank}</span>
                            <span className={styles.title}>칭호: {title?.item_name ?? '-'}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* ✅ 반드시 profileRow 바깥에 있어야 아래로 정렬됨 */}
                <div className={styles.scoreBottomRow}>
                  <span className={styles.score}>점수: {user.score ?? 0}</span>
                  <span className={styles.score}>
                    시간: {typeof user.elapsedTime === 'number' ? user.elapsedTime.toFixed(3) + '초' : '-'}
                  </span>
                </div>

                {/* 채팅 말풍선 */}
                {userRecentChats[user.userNick] && (() => {
                const balloon = itemMap ? itemMap[profile.balloonItemNo] : null;
                return (
                  <div className={styles.chatBubbleWrapper}>
                    {balloon && (
                      <div className={styles.chatBubble}>
                        <img src={`/images/${balloon.imageFileName}`} alt="Chat Balloon" />
                        <span className={styles.chatMessage}>
                          {userRecentChats[user.userNick].message}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            ): (
              // 빈 자리 슬롯
              <div key={`empty_${i}`} className={styles.user_card} style={{ opacity: 0.4, justifyContent: 'center' }}>
                <span>빈 자리</span>
              </div>
            );
          })}
        </div>
        <div className={styles.nowTime}>
          <span>현재 시간</span>
          <span>{date.toLocaleTimeString()}</span>
        </div> 
      </div>
        {
          leaveModal && (
            <LeaveModal 
              onConfirm={leaveRoom} 
              onCancel={() => setLeaveModal(false)}
              gameMode={gameMode}
              play={play}
            />
          )
        }
        {
          result &&
            <ResultModal users={rankedUsers}
              setResult={setResult}
              gameMode={gameMode}
              myElapsedTimes={userElapsedTimes}
              myTotalElapsed={myTotalElapsed}
              roomNo={roomNo}
              userNick={userNick}
              server={server}/>
        }
      </div>
    </div>
  );
};

export default InPlay;