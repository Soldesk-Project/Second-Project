import React, { useState, useEffect } from 'react';
import '../../css/adminPage/Register.css'; // CSS 파일 임포트

const QuestRegister = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('1');
  const [subject, setSubject] = useState('정보처리기사');
  const [base64ImageString, setBase64ImageString] = useState('');
  const token = localStorage.getItem('token');

  // 사용자에게 보여줄 과목 목록
  const subjects = [
    '정보처리기사',
    '정보처리산업기사',
    '정보처리기능사',
    '리눅스마스터1급',
    '리눅스마스터2급',
    '정보통신산업기사',
    '정보통신기사',
    '정보보안기사',
    '네트워크관리사1급',
    '네트워크관리사2급',
  ];

  // 사용자에게 보이는 과목명과 DB에 저장될 실제 값을 매핑하는 Map
  const subjectValueMap = {
    '정보처리기사': 'cpe',
    '정보처리산업기사': 'cpei',
    '정보처리기능사': 'cpet',
    '리눅스마스터1급': 'lm1',
    '리눅스마스터2급': 'lm2',
    '정보통신산업기사': 'icti',
    '정보통신기사': 'ict',
    '정보보안기사': 'sec',
    '네트워크관리사1급': 'net1',
    '네트워크관리사2급': 'net2',
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  // 이미지 선택 핸들러
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        const base64 = reader.result.split(',')[1];
        setBase64ImageString(base64);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setPreviewImage(null);
      setBase64ImageString('');
    }
  };

  // 전체 문제 등록 제출 핸들러
  const handleQuestRegisterSubmit = async () => {
    // 필수 입력 필드 검증
    if (!subject.trim()) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!questionText.trim()) {
      alert('문제 본문을 입력해주세요.');
      return;
    }
    for (let i = 0; i < options.length; i++) {
      if (!options[i].trim()) {
        alert(`${i + 1}번 선택지를 입력해주세요.`);
        return;
      }
    }
    if (!correctAnswer.trim()) {
      alert('정답을 선택해주세요.');
      return;
    }

    // `subjectValueMap`을 사용하여 실제 DB에 저장될 값을 가져옴
    const dbSubjectValue = subjectValueMap[subject];
    if (!dbSubjectValue) {
      alert('유효하지 않은 과목입니다.');
      return;
    }

    const questData = {
      subject: dbSubjectValue,
      question_text: questionText,
      option_1: options[0],
      option_2: options[1],
      option_3: options[2],
      option_4: options[3],
      correct_answer: parseInt(correctAnswer),
      image_data_base64: base64ImageString,
    };

    try {
      const response = await fetch(`api/admin/registerQuestion?`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData),
      });

      if (response.ok) {
        alert('문제 등록 성공!');
        handleReset(); // 성공 시 폼 초기화
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('문제 등록 실패 상세:', errorData);
          alert('문제 등록 실패: ' + (errorData.message || '알 수 없는 오류'));
        }
      }
    } catch (error) {
      console.error('문제 등록 오류:', error);
      alert('문제 등록 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('1');
    setSubject('정보처리기사');
    setBase64ImageString('');
  };

  return (
    <div className="quest-register-container">
      <div className="quest-register-splitViewContainer">
        <div className="quest-register-leftPanel">
          <h1 className="quest-register-title">문제 등록</h1>
          
          <div className='category-section'>
            <h3 className="section-title">1. 카테고리 선택</h3>
            <select name="cateSelect" value={subject} onChange={handleSubjectChange} className="category-select">
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          
          <div className='question-text-section'>
            <h3 className="section-title">2. 문제 본문 입력</h3>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="question-text-input"
              placeholder="문제 본문을 입력하세요."
            />
          </div>
          
          <div className='option-section'>
            <h3 className="section-title">3. 선택지 입력</h3>
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  className="option-input"
                  placeholder={`${index + 1}번 선택지를 입력하세요.`}
                />
              </div>
            ))}
          </div>
          
          <div className='correct-answer-section'>
            <h3 className="section-title">4. 정답 입력</h3>
            <select name="corAnsSelect" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="correct-answer-select">
              {options.map((_, index) => (
                <option key={index + 1} value={String(index + 1)}>{index + 1}</option>
              ))}
            </select>
          </div>
          
          <div className="photo-input-section">
            <h3 className="section-title">5. 이미지 업로드 (선택 사항)</h3>
            <div className="image-upload-wrapper">
              <label htmlFor="image-upload" className="image-upload-label">이미지 선택:</label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="image-upload-input"
              />
            {previewImage && (
              <div className="quest-register-imageContainer">
                <h3 className="image-preview-title">이미지 미리보기:</h3>
                <img src={previewImage} alt="Image Preview" className="image-preview" />
              </div>
            )}
            </div>
          </div>
          
          <div className="button-group">
            <button onClick={handleReset} className="reset-button">초기화</button>
            <button onClick={handleQuestRegisterSubmit} className="submit-button">제출</button>
          </div>
        </div>
        <div className="quest-register-rightPanel">
            <div style={{ padding: '20px' }}>
              <h2 style={{marginBottom:'20px'}}>미리보기</h2>

              {/* 문제 본문 */}
              <div style={{ 
                marginBottom: '10px', 
                display: '-webkit-box',
                WebkitLineClamp: 8,       // 최대 보여줄 줄 수
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis' 
                }}>
                <h3>{questionText || '문제 본문이 여기에 표시됩니다.'}</h3>
              </div>

              {/* 이미지 */}
              {previewImage && (
                <div style={{ marginBottom: '10px' }}>
                  <img
                    src={previewImage}
                    alt="미리보기 이미지"
                    style={{ maxWidth: '162px', height: 'auto', border: '1px solid #ccc' }}
                  />
                </div>
              )}

              {/* 선택지 */}
              <div style={{ marginBottom: '10px' }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ margin: '5px 0' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center', // 세로 정렬 핵심!
                      gap: '8px',           // 버튼과 텍스트 간격
                    }}>
                      <input
                        type="radio"
                        name="previewAnswer"
                        value={idx + 1}
                        checked={String(idx + 1) === correctAnswer}
                        readOnly
                      />
                      {opt || `${idx + 1}번 선택지`}
                    </label>
                  </div>
                ))}
              </div>

              {/* 정답 */}
              <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                {correctAnswer ? `정답: ${correctAnswer}번` : '정답을 선택해주세요.'}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuestRegister;