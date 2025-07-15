import React, { useEffect, useState } from 'react';
import Loading from './Loading';

const ExamOMRViewer = ({question, onSelectAnswer, selectedAnswer, nextId}) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  
  useEffect(()=>{
    setCurrentQuestion(question);
  }, [question])


  const handleChange = (e) => {
    onSelectAnswer(e.target.value);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto 100px' }}>
      {currentQuestion ? (
        <div style={{ marginBottom: '40px',  paddingBottom: '20px' }}>
          <h3>{nextId+1}. {currentQuestion.question_text}</h3>

          {currentQuestion.image_data && (
            <div style={{ margin: '10px 0' }}>
              <img
                src={`data:image/png;base64,${currentQuestion.image_data}`}
                alt="문제 이미지"
                style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }}
              />
            </div>
          )}

          <div>
            {[1, 2, 3, 4].map(num => (
              <div key={num}>
                <label>
                  <input
                    type="radio"
                    name={`q${currentQuestion.id}`}
                    value={num}
                    checked={selectedAnswer === String(num)}
                    onChange={handleChange}
                    /> {currentQuestion[`option_${num}`]}
                  <br />
                </label>
              </div>
            ))}
          </div>
          <div>
           <span> 정답 : {currentQuestion.correct_answer} </span>
          </div>
            {/* <button onClick={handleSubmit} style={{ marginTop: '20px' }} disabled={disabled}>제출</button> */}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          {/* <h2>✅ 모든 문제를 다 풀었습니다!</h2> */}
          <Loading/>
        </div>
      )}
    </div>
  );
};

export default ExamOMRViewer;