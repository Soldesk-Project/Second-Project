import React, { useState, useEffect } from 'react';
import '../../css/adminPage/QuestDelete.css'; // 수정된 QuestDelete.css 임포트

const QuestDelete = () => {
  const [category, setCategory] = useState('정보처리기사');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [selectedQuestData, setSelectedQuestData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  const [selectedQuestionsToDelete, setSelectedQuestionsToDelete] = useState(new Set());

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
    setSelectedQuestData(null);
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedQuestionsToDelete(new Set()); // 카테고리 변경 시 선택된 문제 초기화
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

  // 1. <li> 요소 클릭 시 문제 상세 정보만 표시하도록 변경
  const handleQuestListItemClick = (question) => {
    setSelectedQuestId(question.id);
    setSelectedQuestData(question);
  };

  // 2. 체크박스 변경 시에만 삭제 목록 Set을 업데이트하도록 분리
  const handleCheckboxChange = (event, questionId) => {
    // 이벤트 버블링 방지 (li의 onClick 이벤트가 동시에 발생하지 않도록)
    event.stopPropagation();
    setSelectedQuestionsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleDeleteSelectedQuests = async () => {
    if (selectedQuestionsToDelete.size === 0) {
      alert('삭제할 문제를 하나 이상 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedQuestionsToDelete.size}개의 문제를 정말 삭제하시겠습니까?`)) {
      return;
    }

    const tableName = categoryTableMap[category];
    if (!tableName) {
      alert('유효하지 않은 카테고리입니다.');
      return;
    }

    try {
      const response = await fetch(`/admin/deleteQuestions?category=${encodeURIComponent(tableName)}&ids=${Array.from(selectedQuestionsToDelete).join(',')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('선택된 문제가 성공적으로 삭제되었습니다.');
        setSelectedQuestionsToDelete(new Set());
        setSelectedQuestId(null);
        setSelectedQuestData(null);
        handleSearchQuest(currentPage); // 삭제 후 현재 페이지의 검색 결과 새로고침
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('문제 삭제 실패 상세:', errorData);
          alert('문제 삭제 실패: ' + (errorData.message || '알 수 없는 오류'));
        } else {
          console.error('문제 삭제 실패: 서버 응답 형식 오류');
          alert('문제 삭제 실패: 서버 응답 오류. 콘솔을 확인하세요.');
        }
      }
    } catch (error) {
      console.error('문제 삭제 중 클라이언트 오류:', error);
      alert('문제 삭제 중 클라이언트 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    // 카테고리 변경 시 검색 결과 및 선택 상태 초기화
    setSearchResults([]);
    setSearchQuery('');
    setSelectedQuestId(null);
    setSelectedQuestData(null);
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedQuestionsToDelete(new Set());
  }, [category]);

  return (
    <div>
      <h1>문제 삭제</h1>
      <div className='category'>
        <h3>1. 카테고리 선택 및 문제 검색</h3>
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
          <h3>검색 결과 ({searchResults.length}개): 삭제할 문제를 선택하세요.</h3>
          <ul>
            {searchResults.map((quest) => (
              <li
                key={quest.id}
                // <li> 클릭 시에는 문제 상세 정보만 보여줌
                onClick={() => handleQuestListItemClick(quest)}
                className={selectedQuestionsToDelete.has(quest.id) ? 'selected-delete' : ''}
              >
                <input
                  type="checkbox"
                  checked={selectedQuestionsToDelete.has(quest.id)}
                  // 3. 체크박스 클릭 시에만 삭제 목록 업데이트 (이벤트 버블링 방지)
                  onChange={(e) => handleCheckboxChange(e, quest.id)}
                />
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

      {selectedQuestData && (
        <>
          <hr />
          <div className='question-detail-form'>
            <h2>선택된 문제 정보</h2>
            <p>선택된 문제 ID: <strong>{selectedQuestData.id}</strong></p>
            <div className='questionText'>
              <h3>문제 본문</h3>
              <div className="read-only-field">
                {selectedQuestData.question_text}
              </div>
            </div>
            <div className='option'>
              <h3>선택지</h3>
              {['option_1', 'option_2', 'option_3', 'option_4'].map((optionKey, index) => (
                <div key={index}>
                  <div className="read-only-field">
                    {index + 1}. {selectedQuestData[optionKey]}
                  </div>
                </div>
              ))}
            </div>
            <div className='corAnswer'>
              <h3>정답</h3>
              <div className="read-only-field">
                {selectedQuestData.correct_answer}
              </div>
            </div>
            <div className="photo-input-section">
              <h3 className="section-title">이미지</h3>
              <div className="image-preview-container">
              {selectedQuestData.image_data_base64 ? (
                <div>
                  <img src={`data:image/png;base64,${selectedQuestData.image_data_base64}`} alt="Image-preview" className="image-preview"/>
                </div>
              ) : (
                <div className="no-image-message">
                  첨부된 이미지가 없습니다.
                </div>
              )}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="button-group">
        <button onClick={handleDeleteSelectedQuests} className="delete-button">선택된 문제 삭제</button>
      </div>
    </div>
  );
};

export default QuestDelete;