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

  useEffect(() => {
      const socket = sockets['room'];
      if (!socket) return;
  
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ action: 'join', server, userNick }));
      } else {
        socket.onopen = socket.send(JSON.stringify({ action: 'join', server, userNick }));;
      }
  
      socket.onmessage = (event) => {
        // const data = JSON.parse(event.data);
      };
  
      socket.onclose = () => {

      };
  
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      return () => {
        socket.onmessage = null;
      };
    }, [server, sockets, userNick]);

  useEffect(()=>{
    asdf();
  },[])




  const asdf=async()=>{
    const resp=await axios.post('/api/questionReviewList', {userNick});
    console.log('userNick:', userNick);
    const data=resp.data
    console.log(data);
    
    setQuestionReviewList(data);    
    setLoading(false);
  }
  
  const formatDate=(timestamp)=>{
    const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  const playQuestionReviewHistory=async(submmitedAt)=>{
    console.log(submmitedAt);
    const resp=await axios.post('/api/userQuestionHistory', {submmitedAt});
    console.log('submmitedAt:', submmitedAt);
    const data=resp.data
    console.log(data);
    
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
                <butzton onClick={leaveRoom} className={styles.leaveBtn}>나가기</butzton>
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
          {
            loading?
            <Loading/>
            :
              (questionReviewList.map(questionList=>(
                <div key={questionList.submitted_at} className={styles.questionList}>
                  <div>
                    <button onClick={()=>playQuestionReviewHistory(questionList.submitted_at)} className={styles.playBtn}>풀어보기</button>
                  </div>
                  <div className={styles.role_badge}>{formatDate(questionList.submit_date)??'x'}</div>
                  <div className={styles.questionList_info}>
                    <span className={styles.nick}>{questionList.user_nick===userNick?userNick:'잘못된 닉네임'}</span>
                    <span className={styles.score}>정답율: {questionList.correct_count*5??'x'}%</span>
                  </div>
                </div>
              )))
          }
        </div>
      </div>
    </div>
  );
};

export default QuestionReview;