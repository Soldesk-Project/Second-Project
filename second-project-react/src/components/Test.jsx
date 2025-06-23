import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExamOMRViewer = () => {
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  // 문제 불러오기
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('/api/questions');
        setAllQuestions(res.data);
        pickRandomQuestion(res.data, []);
      } catch (err) {
        console.error('문제 불러오기 실패:', err);
      }
    };
    fetchQuestions();
  }, []);

  const pickRandomQuestion = (questions, used) => {
    const remaining = questions.filter(q => !used.includes(q.id));
    if (remaining.length === 0) {
      setCurrentQuestion(null); // 모든 문제 완료
      return;
    }
    const random = remaining[Math.floor(Math.random() * remaining.length)];
    setCurrentQuestion(random);
    setUsedQuestionIds([...used, random.id]);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) {
      alert("답안을 선택하세요.");
      return;
    }
    const correct = currentQuestion.correct_answer === parseInt(selectedAnswer);
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleNext = () => {
    pickRandomQuestion(allQuestions, usedQuestionIds);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      {currentQuestion ? (
        <div style={{ marginBottom: '40px', borderBottom: '1px solid #ccc', paddingBottom: '20px' }}>
          <h3>{usedQuestionIds.length}. {currentQuestion.question_text}</h3>

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
              <label key={num}>
                <input
                  type="radio"
                  name={`q${currentQuestion.id}`}
                  value={num}
                  checked={selectedAnswer === String(num)}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={showResult}
                /> {currentQuestion[`option_${num}`]}
                <br />
              </label>
            ))}
          </div>

          {!showResult ? (
            <button onClick={handleSubmit} style={{ marginTop: '20px' }}>제출</button>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <strong style={{ color: isCorrect ? 'green' : 'red' }}>
                {isCorrect ? '✅ 정답입니다!' : '❌ 틀렸습니다.'}
              </strong>
              <br />
              <span>정답: {currentQuestion[`option_${currentQuestion.correct_answer}`]}</span>
              <br />
              <button onClick={handleNext} style={{ marginTop: '10px' }}>다음 문제</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>✅ 모든 문제를 다 풀었습니다!</h2>
        </div>
      )}
    </div>
  );
};

export default ExamOMRViewer;
