import React, { useState, useEffect } from 'react';

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

  // 카테고리 목록 정의
  const categories = [
    '정보처리기사', '정보처리산업기사', '정보처리기능사',
    '리눅스마스터1급', '리눅스마스터2급',
    '정보통신산업기사', '정보통신기사', '정보보안기사',
    '네트워크관리사1급', '네트워크관리사2급',
  ];

  // 카테고리-DB 테이블명 매핑 (백엔드와 일치시킬 것)
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

  // 카테고리 변경 핸들러
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    setSearchResults([]); // 카테고리 변경 시 검색 결과 초기화
    setSearchQuery(''); // 검색어 초기화
    setSelectedQuestId(null); // 선택된 문제 초기화
    handleReset(); // 폼 내용 초기화
    setCurrentPage(1); // 페이지 초기화
    setTotalPages(1); // 총 페이지 수 초기화
  };

  // 이미지 선택 핸들러
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        // Base64 문자열에서 "data:image/jpeg;base64,"와 같은 MIME 타입 부분을 제거
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

  // 문제 검색 핸들러 (실제 백엔드 호출)
  const handleSearchQuest = async (page = 1) => {
    const tableName = categoryTableMap[category];
    if (!tableName) {
      alert('유효하지 않은 카테고리입니다.');
      return;
    }

    try {
      // 검색 API 엔드포인트는 백엔드에 맞게 수정 필요. (예: /admin/searchQuestions)
      // 문제 검색을 위한 새로운 GET 엔드포인트가 백엔드에 필요합니다.
      // 쿼리 파라미터로 category(테이블명), searchQuery(문제 본문 검색어), page, limit을 보냅니다.
      const response = await fetch(`/admin/searchQuestions?category=${tableName}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // { questions: [], totalPages: N } 형태를 기대

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

  // 문제 선택 핸들러 (검색 결과에서 문제 클릭 시)
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

    // 이미지 데이터가 있을 경우 Base64 디코딩 후 미리보기에 설정
    if (question.image_data_base64) {
      setBase64ImageString(question.image_data_base64);
      setPreviewImage(`data:image/png;base64,${question.image_data_base64}`); // 또는 question.image_data_base64 자체에 이미 'data:image/png;base64,'가 포함되어 있다면 그대로 사용
    } else {
      setBase64ImageString('');
      setPreviewImage(null);
    }
  };

  // 전체 문제 수정 제출 핸들러 (기존 /admin/editQuestion 엔드포인트 사용)
  const handleQuestEditSubmit = async () => {
    if (selectedQuestId === null) {
      alert('수정할 문제를 먼저 선택해주세요.');
      return;
    }

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

    const questData = {
      id: selectedQuestId, // QuestionDTO의 id 필드에 문제의 ID를 보냄
      subject: "임시주제", // 백엔드에서 사용하지 않는다면 제거 가능
      question_text: questionText,
      option_1: options[0],
      option_2: options[1],
      option_3: options[2],
      option_4: options[3],
      correct_answer: parseInt(correctAnswer),
      image_data_base64: base64ImageString, // Base64 문자열로 전송
    };

    console.log('수정할 문제 데이터:', questData);

    try {
      // 기존 /admin/editQuestion 엔드포인트를 사용하되, categoryParam은 쿼리 파라미터로
      // 또는 백엔드에서 QuestionDTO에 category 필드를 추가하는 것이 더 RESTful 할 수 있습니다.
      // 현재 백엔드 코드가 @RequestParam("category")를 사용하므로, 쿼리 파라미터로 보냅니다.
      const response = await fetch(`/admin/editQuestion?category=${encodeURIComponent(categoryTableMap[category])}`, {
        method: 'POST', // PUT 또는 PATCH가 더 적합할 수 있으나, 현재 POST로 되어있으므로 유지
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData),
      });

      if (response.ok) {
        alert('문제 수정 성공!');
        handleReset(); // 성공 시 폼 초기화
        setSearchResults([]); // 검색 결과도 초기화
        setSearchQuery(''); // 검색어도 초기화
        setSelectedQuestId(null); // 선택된 문제도 초기화
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

  // 폼 초기화 핸들러
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('1');
    setBase64ImageString('');
    // 카테고리와 검색 관련 상태는 유지. 필요시 리셋
  };

  // 컴포넌트 마운트 시 또는 카테고리 변경 시, 검색 결과 초기화 및 페이지 리셋
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
      <br />
      <div className='category'>
        <h3>1. 카테고리 선택 및 문제 검색 🔍</h3>
        <select name="cateSelect" value={category} onChange={handleCategoryChange} style={{ marginRight: '10px', padding: '8px' }}>
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
          style={{ width: '40%', padding: '8px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          onKeyPress={(e) => { // 엔터 키로 검색
            if (e.key === 'Enter') {
              handleSearchQuest();
            }
          }}
        />
        <button onClick={() => handleSearchQuest()} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults' style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <h3>검색 결과 ({searchResults.length}개): 문제를 클릭하여 수정하세요.</h3>
          <ul style={{ listStyle: 'none', padding: 0, maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
            {searchResults.map((quest) => (
              <li
                key={quest.id}
                onClick={() => handleSelectQuest(quest)}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedQuestId === quest.id ? '#e0f7fa' : 'transparent',
                  fontWeight: selectedQuestId === quest.id ? 'bold' : 'normal',
                }}
              >
                <span style={{ color: '#555', marginRight: '10px' }}>[ID: {quest.id}]</span>
                {quest.question_text.length > 80 ? quest.question_text.substring(0, 80) + '...' : quest.question_text}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '15px', textAlign: 'center' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => handleSearchQuest(pageNumber)}
                  style={{
                    margin: '0 5px',
                    padding: '8px 12px',
                    backgroundColor: currentPage === pageNumber ? '#007bff' : '#f0f0f0',
                    color: currentPage === pageNumber ? 'white' : 'black',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
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
          <hr style={{ margin: '30px 0', borderTop: '1px solid #eee' }} />
          <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '5px', backgroundColor: '#fff' }}>
            <h2>선택된 문제 수정 ✏️</h2>
            <p style={{ color: '#666', fontSize: '0.9em' }}>선택된 문제 ID: <strong>{selectedQuestId}</strong></p>
            <br />
            <div className='questionText' style={{ marginBottom: '15px' }}>
              <h3>2. 문제 본문 입력</h3>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                style={{ width: '90%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="문제 본문을 입력하세요."
              />
            </div>
            <br />
            <div className='option' style={{ marginBottom: '15px' }}>
              <h3>3. 선택지 입력</h3>
              {options.map((option, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    style={{ width: '80%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder={`${index + 1}번 선택지를 입력하세요.`}
                  />
                </div>
              ))}
            </div>
            <br />
            <div className='corAnswer' style={{ marginBottom: '15px' }}>
              <h3>4. 정답 입력</h3>
              <select name="corAnsSelect" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                {options.map((_, index) => (
                  <option key={index + 1} value={String(index + 1)}>{index + 1}</option>
                ))}
              </select>
            </div>
            <br />
            <div className="photoInput" style={{ marginBottom: '20px' }}>
              <h3>5. 이미지 업로드 (선택 사항)</h3>
              <div style={{ marginBottom: '10px' }}>
                <label htmlFor="image-upload" style={{ marginRight: '10px', fontWeight: 'bold' }}>이미지 선택:</label>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ padding: '5px' }}
                />
              </div>
              {previewImage && (
                <div style={{ marginTop: '15px' }}>
                  <h4>이미지 미리보기:</h4>
                  <img src={previewImage} alt="Image Preview" style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
              )}
            </div>
            <br />
            <button onClick={handleReset} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>현재 내용 초기화</button>
            <button onClick={handleQuestEditSubmit} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>수정 완료</button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestEdit;