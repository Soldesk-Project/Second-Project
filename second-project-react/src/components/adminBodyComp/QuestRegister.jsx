import React, { useState, useEffect } from 'react'; // useEffect 추가

const QuestRegister = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [questionText, setQuestionText] = useState(''); // 문제 본문 상태
  const [options, setOptions] = useState(['', '', '', '']); // 선택지 상태
  const [correctAnswer, setCorrectAnswer] = useState('1'); // 정답 상태

  // 카테고리와 주제 상태 정의 (가장 위로 옮김)
  const [category, setCategory] = useState('정보처리기사'); // 카테고리 상태 (기본값)

  // 카테고리 목록 정의 (별도의 배열로 관리하면 추후 유지보수 용이)
  const categories = [
    '정보처리기사',
    '정보처리기능사',
    '리눅스마스터1급',
    '리눅스마스터2급',
    '정보통신산업기사',
    '정보통신기사',
    '정보보안기사',
    '네트워크관리사1급',
    '네트워크관리사2급',
  ];

  // 카테고리 변경 핸들러
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
  };

  // 이미지 선택 핸들러
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setPreviewImage(null);
    }
  };

  // 이미지 업로드 제출 핸들러 (개별 함수로 분리)
  const handleImageUploadSubmit = async (event) => {
    event.preventDefault(); // 폼의 기본 제출 동작 방지

    if (!selectedImage) {
      alert('이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      // 실제 API 엔드포인트로 변경하세요.
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert('이미지 업로드 성공: ' + result.imageUrl);
        // 업로드 성공 후 상태 초기화 (필요시)
        // setSelectedImage(null);
        // setPreviewImage(null);
      } else {
        alert('이미지 업로드 실패');
        const errorData = await response.json(); // 에러 메시지 확인
        console.error('이미지 업로드 실패 상세:', errorData);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  // 전체 문제 등록 제출 핸들러
  const handleQuestRegisterSubmit = async () => {
    const questData = {
      category: category,
      questionText: questionText,
      options: options,
      correctAnswer: correctAnswer,
    };

    console.log('등록할 문제 데이터:', questData);
    alert('문제 등록 로직 실행됨 (콘솔 확인)'); // 임시 알림
  };

  // 폼 초기화 핸들러
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('1');
    setCategory('정보처리기사'); // 초기 카테고리로 재설정
  };

  return (
    <div>
      <h1>문제 등록</h1>
      <br/>
      <div className='category'>
        <h3>1. 카테고리 선택</h3>
        <select name="cateSelect" value={category} onChange={handleCategoryChange}>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <br/>
      <div className='questionText'>
        <h3>2. 문제 본문 입력</h3>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          style={{ width: '80%', padding: '5px' }}
          placeholder="문제 본문을 입력하세요."
        />
      </div>
      <br/>
      <div className='option'>
        <h3>3. 선택지 입력</h3>
        {options.map((option, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
              style={{ width: '70%', padding: '5px' }}
              placeholder={`${index + 1}번 선택지를 입력하세요.`}
            />
          </div>
        ))}
      </div>
      <br/>
      <div className='corAnswer'>
        <h3>4. 정답 입력</h3>
        <select name="corAnsSelect" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
          {options.map((_, index) => (
            <option key={index + 1} value={String(index + 1)}>{index + 1}</option>
          ))}
        </select>
      </div>
      <br/>
      <div className="photoInput">
        <h3>5. 이미지 업로드 (선택 사항)</h3>
        <form onSubmit={handleImageUploadSubmit}>
          <div>
            <label htmlFor="image-upload">이미지 선택:</label>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          {previewImage && (
            <div style={{ marginTop: '20px' }}>
              <h3>이미지 미리보기:</h3>
              <img src={previewImage} alt="Image Preview" style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ddd' }} />
            </div>
          )}
          <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }}>
            이미지 업로드
          </button>
        </form>
      </div>
      <br/>
      {/* 전체 폼 제출 버튼 */}
      <button onClick={handleReset} style={{ marginRight: '10px', padding: '10px 20px' }}>초기화</button>
      <button onClick={handleQuestRegisterSubmit} style={{ padding: '10px 20px' }}>등록 완료</button>
    </div>
  );
};

export default QuestRegister;