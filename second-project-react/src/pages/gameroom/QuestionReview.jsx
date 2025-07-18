import React, { useContext, useEffect, useState } from 'react';
import styles from '../../css/QuestionReview.module.css';
import { useSelector } from 'react-redux';
import { WebSocketContext } from '../../util/WebSocketProvider';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../../components/Loading';

const QuestionReview = () => {
  const [questionReviewList, setQuestionReviewList]=useState([]);
  const [loading, setLoading] = useState(true);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const nav = useNavigate();

  const sockets = useContext(WebSocketContext);

  // useEffect(() => {
  //     const socket = sockets['room'];
  //     if (!socket) return;
  
  //     const joinAndRequestUserList = () => {
  //       socket.send(JSON.stringify({ action: 'join', server, userNick }));
  //     };
  
  //     if (socket.readyState === 1) {
  //       joinAndRequestUserList();
  //     } else {
  //       socket.onopen = joinAndRequestUserList;
  //     }
  
  //     socket.onmessage = (event) => {
  //       const data = JSON.parse(event.data);
        
  //     };
  
  //     socket.onclose = () => {

  //     };
  
  //     socket.onerror = (error) => {
  //       console.error('WebSocket error:', error);
  //     };
  
  //     return () => {
  //       socket.onmessage = null;
  //     };
  //   }, [server, sockets, userNick]);

  useEffect(()=>{
    // asdf();







  },[])




  const asdf=async()=>{
    const resp=await axios.post('/api/questionReviewList', {userNick});
    const data=resp.data
    setQuestionReviewList(data);    
    setLoading(false);
    






  }








  // 다음 문제 버튼
  const nextQuestion=()=>{
    
  }

  // 나가기 버튼
  const leaveRoom = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: 'questionReview',
        userNick: userNick
      }));
    }
    nav('/main/' + server);
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.body_left}>
          <div className={styles.solving}>
            <div className={styles.problem}>
              <div className={styles.testHeader}>
                <span>문제 다시 풀어 보기</span>
              </div>
              <div className={styles.initiatorBtn}>
                <button onClick={nextQuestion} >다음 문제</button>
                <button onClick={leaveRoom} className={styles.leaveBtn}>나가기</button>
              </div>
              <div className={styles.gamePlay}>
                {/* {
                  play ? 
                  <Test question={question} 
                        nextId={nextId}
                        onSelectAnswer={setSelectedAnswer} // 추가!
                        selectedAnswer={selectedAnswer}/> : 
                  <h2>대기중</h2>
                } */}
              </div>
            </div>
          </div>
          <div className={styles.chat_box}>
            {/* {userNick && userNo != null && roomNo ? (
              <GameChatbox gameroomNo={roomNo} userNick={userNick} userNo={userNo} onNewMessage={handleNewChatMessage}/>
            ) : (
              <p>채팅을 로드할 수 없습니다. 사용자 정보 또는 게임방 번호를 확인 중...</p>
            )} */}
          </div>
        </div>
        <div className={styles.body_right}>
          <div className={styles.questionList}>
            {
              loading?
              <Loading/>
              :
                (questionReviewList.map(questionList=>(
                  <div key={questionList.uuid} className={styles.questionList}>
                    <div className={styles.role_badge}>{questionList.submit_date}</div>
                    <div className={styles.questionList_info}>
                      <span className={styles.nick}>{userNick}</span>
                      <span className={styles.score}>정답율: {0}%</span>
                      <button>풀어보기</button>
                    </div>
                  </div>
                )))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionReview;