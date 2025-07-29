/* eslint-disable no-restricted-globals */
import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from '../../css/QuestionReview.module.css';
import { useSelector } from 'react-redux';
import { WebSocketContext } from '../../util/WebSocketProvider';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../../components/Loading';
import Test from '../../components/Test';

const QuestionReview = () => {
  const [questionReviewList, setQuestionReviewList]=useState([]);
  const [loading, setLoading] = useState(true);
  const [play, setPlay] = useState(false);
  const [nextId, setNextId] = useState(0);
  const [question, setQuestion] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectAnswer, setSelectAnswer] = useState(null);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [point, setPoint] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [explanation, setExplanation] = useState("");  // ← 해설 내용
  const [explanationLoading, setExplanationLoading] = useState(false); // ← 로딩 표시용
  const questionListRef = useRef([]);
  const { user, server } = useSelector((state) => state.user);
  const userNick = user.user_nick;
  const userNo = user.user_no;
  const userId = user?.user_id;
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
    getQuestionReviewList();
    getPoint();
  },[])

  const getQuestionReviewList=async()=>{
    const resp=await axios.post('/api/questionReviewList', {userNick});
    console.log('userNick:', userNick);
    const data=resp.data
    console.log(data);
    
    setQuestionReviewList(data);    
    setLoading(false);
  }
  const getPoint=async()=>{
    // console.log("userId : "+userId);
    
    if (!userId) return;
    try {
      const resp = await axios.get(`/api/user/point?user_id=${userId}`);
      console.log(resp.data);
      
      setPoint(resp.data);
    } catch (error) {
      console.error('포인트 불러오기 실패:', error);
    }
  }
  
  const formatDate=(timestamp)=>{
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  const playQuestionReviewHistory=async(submittedAt)=>{
    // console.log(submittedAt);
    const resp=await axios.post('/api/userQuestionHistory', {submittedAt});
    // console.log('submmitedAt:', submittedAt);
    const data=resp.data
    console.log(data);
    questionListRef.current = data
    setReviewQuestions(resp.data);
    setNextId(0);
    setQuestion(data[nextId])
    setPlay(true);
    // setIsCorrect(data[nextId]._correct)
  }

  // 다음 문제 버튼
  const prevQuestion=()=>{
    setNextId(prev=>prev-1);
  }
  const nextQuestion=()=>{
      setNextId(prev=>prev+1);
  }
  
  // 포인트로 정답 확인 버튼
  const getAnswer=async()=>{
    if (play) {
      if (confirm('포인트를 소모하여 정답을 확인하시겠습니까?')) {
        await axios.post('/api/usePoint', {userNo});
        // console.log("정답 : "+question.correct_answer);
        // console.log("아이디 : "+question.history_id);
        // console.log("고른답 : "+question.selected_answer);
        // console.log("정답유무 : "+question._correct);
        // console.log("문제 : "+question.question_text);
        // console.log("과목 : "+question.subject);
        
        console.log(question);
        setExplanation("");
        setExplanationLoading(true);
        setShowAnswer(true);
        getPoint();

        const res = await axios.post('api/groq-explanation',{
          question: question.question_text,
          choices:[
            question.option_1,
            question.option_2,
            question.option_3,
            question.option_4
          ],
          correct: question.correct_answer,
          userAnswer: question.selected_answer
        });

        setExplanation(res.data);
        setExplanationLoading(false);
      }
    }else{
      alert('문제 풀이 중이 아닙니다');
    }
  }

  useEffect(()=>{
    if (questionListRef.current.length>nextId) {
      setQuestion(questionListRef.current[nextId]);
      // setIsCorrect(question._correct);
    } else {
      setPlay(false);
    }
  },[nextId])

  useEffect(() => {
  if (question &&play) {
    setIsCorrect(question._correct);
    setSelectedAnswer(question.selected_answer);
    setAnswer(question.correct_answer);
    setShowAnswer(false);
  }
  }, [question]);

  // 나가기 버튼
  const leaveRoom = () => {
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: 'questionReview',
        gameMode: 'normal',
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
                <h1>문제 다시 풀어 보기</h1>
              </div>
              <div className={styles.initiatorBtn}>
                <button onClick={prevQuestion} >이전 문제</button>
                <button onClick={nextQuestion} >다음 문제</button>
                <button onClick={getAnswer} >포인트로 정답 확인하기</button>
                {
                  play?(<p className={styles.isCorrect}>내가 {isCorrect?'맞춘':'틀린'} 문제 입니다</p>):null
                }
                <span>내 보유 포인트 : {point}p</span>
                <button onClick={leaveRoom} className={styles.leaveBtn}>나가기</button>
              </div>
              <div className={styles.playDiv}>
                <div className={styles.answerTable}>
                  {
                    play &&
                    <table>
                      <tr>
                        <td>번호</td>
                        <td>정답</td>
                      </tr>
                      {
                        reviewQuestions.map((a, idx)=>(
                          <tr key={idx}>
                            <td>{idx+1}</td>
                            <td>{a._correct?'O':'X'}</td>
                          </tr>
                        ))
                      }
                    </table>
                  }
                </div>
                <div className={styles.gamePlay}>
                  {
                    play ? 
                      <>
                        <Test question={question} 
                              nextId={nextId}
                              onSelectAnswer={setSelectAnswer}
                              selectedAnswer={selectAnswer}/> 
                        <span>내가 선택한 정답 : {selectedAnswer!==0?selectedAnswer:'선택하지 않음'}</span>
                      </> : 
                    <h2>대기중</h2>
                  }
                  {showAnswer && (
                      <div className={styles.answerAndExplanation}>
                        <p>문제의 정답: {answer}</p>

                        <div className={styles.explanationBox}>
                          <strong>AI 해설:</strong><br />
                          {explanationLoading ? (
                            <p>해설 생성 중...</p>
                          ) : (
                            <p>{explanation}</p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
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