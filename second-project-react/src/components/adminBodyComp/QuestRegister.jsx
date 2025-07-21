import React, { useState, useEffect } from 'react';
import '../../css/adminPage/QuestRegister.css'; // CSS 파일 임포트

const QuestRegister = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('1');
  const [category, setCategory] = useState('정보처리기사');
  const [base64ImageString, setBase64ImageString] = useState('');

  const categories = [
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

  const categoryTableMap = {
    '정보처리기사': 'CPE_Q',
    '정보처리산업기사': 'CPEI_Q',
    '정보처리기능사': 'CPET_Q',
    '리눅스마스터1급': 'LM1_Q',
    '리눅스마스터2급': 'LM2_Q',
    '정보통신산업기사': 'ICTI_Q',
    '정보통신기사': 'ICT_Q',
    '정보보안기사': 'SEC_Q',
    '네트워크관리사1급': 'NET1_Q',
    '네트워크관리사2급': 'NET2_Q',
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
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

    // 백엔드로 보낼 때는 맵에서 변환된 테이블 이름을 사용
    const tableName = categoryTableMap[category];
    if (!tableName) {
      alert('유효하지 않은 카테고리입니다.');
      return;
    }

    const questData = {
      subject: "임시주제",
      question_text: questionText,
      option_1: options[0],
      option_2: options[1],
      option_3: options[2],
      option_4: options[3],
      correct_answer: parseInt(correctAnswer),
      image_data_base64: base64ImageString,
    };

    console.log('등록할 문제 데이터:', questData);
    console.log('선택된 카테고리 (테이블 결정용):', category);
    console.log('Option 1:', questData.option_1);
    console.log('Option 2:', questData.option_2);
    console.log('Option 3:', questData.option_3);
    console.log('Option 4:', questData.option_4);

    try {
      const response = await fetch(`/admin/registerQuestion?category=${encodeURIComponent(tableName)}`, {
        method: 'POST',
        headers: {
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
    setCategory('정보처리기사');
    setBase64ImageString('');
  };

  return (
    <div className="quest-register-container"> {/* 최상위 div에 클래스 추가 */}
      <h1 className="quest-register-title">문제 등록</h1>
      
      <div className='category-section'>
        <h3 className="section-title">1. 카테고리 선택</h3>
        <select name="cateSelect" value={category} onChange={handleCategoryChange} className="category-select">
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
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
        </div>
        {previewImage && (
          <div className="image-preview-container">
            <h3 className="image-preview-title">이미지 미리보기:</h3>
            <img src={previewImage} alt="Image Preview" className="image-preview" />
          </div>
        )}
      </div>
      
      <div className="button-group">
        <button onClick={handleReset} className="reset-button">초기화</button>
        <button onClick={handleQuestRegisterSubmit} className="submit-button">등록 완료</button>
      </div>
    </div>
  );
};

export default QuestRegister;