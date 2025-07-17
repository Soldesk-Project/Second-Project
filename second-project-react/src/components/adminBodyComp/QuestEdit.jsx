import React, { useState, useEffect } from 'react';
import '../../css/adminPage/QuestEdit.css'; // 수정된 QuestEdit.css 임포트

const QuestEdit = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [questionText, setQuestionText] = useState(''); // 문제 본문 상태
  const [options, setOptions] = useState(['', '', '', '']); // 선택지 상태
  const [correctAnswer, setCorrectAnswer] = useState('1'); // 정답 상태
  const [category, setCategory] = useState('정보처리기사'); // 카테고리 상태 (기본값)
  const [base64ImageString, setBase64ImageString] = useState(''); // Base64 이미지 문자열 저장
  const [searchQuery, setSearchQuery] = useState(''); // 문제 검색어 상태
  const [searchResults, setSearchResults] = useState([]); // 검색 결과 상태
  const [selectedQuestId, setSelectedQuestId] = useState(null); // 선택된 문제 ID
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const itemsPerPage = 5; // 페이지당 표시할 문제 수

  const categories = [
    '정보처리기사', '정보처리산업기사', '정보처리기능사',
    '리눅스마스터1급', '리눅스마스터2급',
    '정보통신산업기사', '정보통신기사', '정보보안기사',
    '네트워크관리사1급', '네트워크관리사2급',
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
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedQuestId(null);
    handleReset();
    setCurrentPage(1);
    setTotalPages(1);
  };

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

  const handleSearchQuest = async (page = 1) => {
    const tableName = categoryTableMap[category];
    if (!tableName) {
      alert('유효하지 않은 카테고리입니다.');
      return;
    }

    try {
      const response = await fetch(`/admin/searchQuestions?category=${tableName}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.questions);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('문제 검색 중 오류 발생:', error);
      alert('문제 검색 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      setSearchResults([]);
      setTotalPages(1);
    }
  };

  const handleSelectQuest = (question) => {
    setSelectedQuestId(question.id);
    setQuestionText(question.question_text);
    setOptions([
      question.option_1,
      question.option_2,
      question.option_3,
      question.option_4,
    ]);
    setCorrectAnswer(String(question.correct_answer));

    if (question.image_data_base64) {
      setBase64ImageString(question.image_data_base64);
      setPreviewImage(`data:image/png;base64,${question.image_data_base64}`);
    } else {
      setBase64ImageString('');
      setPreviewImage(null);
    }
  };

  const handleQuestEditSubmit = async () => {
    if (selectedQuestId === null) {
      alert('수정할 문제를 먼저 선택해주세요.');
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

    const questData = {
      id: selectedQuestId,
      subject: "임시주제",
      question_text: questionText,
      option_1: options[0],
      option_2: options[1],
      option_3: options[2],
      option_4: options[3],
      correct_answer: parseInt(correctAnswer),
      image_data_base64: base64ImageString,
    };

    console.log('수정할 문제 데이터:', questData);

    try {
      const response = await fetch(`/admin/editQuestion?category=${encodeURIComponent(categoryTableMap[category])}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData),
      });

      if (response.ok) {
        alert('문제 수정 성공!');
        handleReset();
        setSearchResults([]);
        setSearchQuery('');
        setSelectedQuestId(null);
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('문제 수정 실패 상세:', errorData);
          alert('문제 수정 실패: ' + (errorData.message || '알 수 없는 오류'));
        } else {
          console.error('문제 수정 실패: 서버 응답 형식 오류');
          alert('문제 수정 실패: 서버 응답 오류. 콘솔을 확인하세요.');
        }
      }
    } catch (error) {
      console.error('문제 수정 오류:', error);
      alert('문제 수정 중 클라이언트 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('1');
    setBase64ImageString('');
  };

  useEffect(() => {
    setSearchResults([]);
    setSearchQuery('');
    setSelectedQuestId(null);
    setCurrentPage(1);
    setTotalPages(1);
  }, [category]);

  return (
    <div>
      <h1>문제 수정</h1>
      <div className='category'>
        <h3>1. 카테고리 선택 및 문제 검색 🔍</h3>
        <select name="cateSelect" value={category} onChange={handleCategoryChange}>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="문제 본문 검색어를 입력하세요."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearchQuest();
            }
          }}
        />
        <button onClick={() => handleSearchQuest()} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults'>
          <h3>검색 결과 ({searchResults.length}개): 문제를 클릭하여 수정하세요.</h3>
          <ul>
            {searchResults.map((quest) => (
              <li
                key={quest.id}
                onClick={() => handleSelectQuest(quest)}
                className={selectedQuestId === quest.id ? 'selected-edit' : ''}
              >
                <span className="quest-id">[ID: {quest.id}]</span>
                {quest.question_text.length > 80 ? quest.question_text.substring(0, 80) + '...' : quest.question_text}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => handleSearchQuest(pageNumber)}
                  className={currentPage === pageNumber ? 'active' : ''}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedQuestId && (
        <>
          <hr />
          <div className='question-detail-form'>
            <h2>선택된 문제 수정 ✏️</h2>
            <p>선택된 문제 ID: <strong>{selectedQuestId}</strong></p>
            <div className='questionText'>
              <h3>2. 문제 본문 입력</h3>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="문제 본문을 입력하세요."
              />
            </div>
            <div className='option'>
              <h3>3. 선택지 입력</h3>
              {options.map((option, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    placeholder={`${index + 1}번 선택지를 입력하세요.`}
                  />
                </div>
              ))}
            </div>
            <div className='corAnswer'>
              <h3>4. 정답 입력</h3>
              <select name="corAnsSelect" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
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
              <button onClick={handleReset} className="reset-button">현재 내용 초기화</button>
              <button onClick={handleQuestEditSubmit} className="submit-button">수정 완료</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestEdit;