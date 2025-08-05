import React, { useState, useRef } from 'react';
// import '../../css/adminPage/Delete.css';

const QuestDelete = () => {
  const [subject, setSubject] = useState('정보처리기사');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedQuestId, setSelectedQuestId] = useState(null); // 단일 선택 문제 ID
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // 한 페이지에 보이는 문제 개수를 5개로 변경
  const itemsPerPage = 5;
  const [selectedQuestionsToDelete, setSelectedQuestionsToDelete] = useState(new Set());
  const [startPage, setStartPage] = useState(1);
  const pagesToShow = 5;
  const token = localStorage.getItem('token');

  const lastSearchQuery = useRef('');

  const subjects = [
    '정보처리기사', '정보처리산업기사', '정보처리기능사',
    '리눅스마스터1급', '리눅스마스터2급',
    '정보통신산업기사', '정보통신기사', '정보보안기사',
    '네트워크관리사1급', '네트워크관리사2급',
  ];

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

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setSubject(selectedCategory);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedQuestId(null); // 카테고리 변경 시 상세 정보 초기화
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedQuestionsToDelete(new Set());
    setStartPage(1);
  };

  const handleSearchQuest = async (page = 1) => {
    const dbSubjectValue = subjectValueMap[subject];
    if (!dbSubjectValue) {
      alert('유효하지 않은 과목입니다.');
      return;
    }

    if (searchQuery !== lastSearchQuery.current || page === 1) {
      setStartPage(1);
    }
    lastSearchQuery.current = searchQuery;

    try {
      const response = await fetch(`/admin/searchQuestions?subject=${encodeURIComponent(dbSubjectValue)}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.questions);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

      if (page < startPage || page >= startPage + pagesToShow) {
        setStartPage(Math.floor((page - 1) / pagesToShow) * pagesToShow + 1);
      }
    } catch (error) {
      console.error('문제 검색 중 오류 발생:', error);
      alert('문제 검색 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      setSearchResults([]);
      setTotalPages(1);
      setCurrentPage(1);
      setStartPage(1);
    }
  };

  const handleQuestListItemClick = (question) => {
    // 이미 선택된 문제를 다시 클릭하면 드롭다운 닫기
    if (selectedQuestId === question.id) {
      setSelectedQuestId(null);
    } else {
      setSelectedQuestId(question.id);
    }
  };

  const handleCheckboxChange = (event, questionId) => {
    event.stopPropagation(); // li 클릭 이벤트 방지
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

    const dbSubjectValue = subjectValueMap[subject];
    if (!dbSubjectValue) {
      alert('유효하지 않은 과목입니다. 과목을 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedQuestionsToDelete.size}개의 문제를 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const idsString = Array.from(selectedQuestionsToDelete).join(',');
      const response = await fetch(
        `/admin/deleteQuestions?subject=${encodeURIComponent(dbSubjectValue)}&ids=${encodeURIComponent(idsString)}`,
        {
          method: 'DELETE',
          headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
        }
      );

      if (response.ok) {
        alert('선택된 문제가 성공적으로 삭제되었습니다.');
        setSelectedQuestionsToDelete(new Set());
        setSelectedQuestId(null); // 삭제 후 상세 정보 초기화
        handleSearchQuest(currentPage); // 현재 페이지를 다시 불러와 목록 업데이트
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

  return (
    <div>
      <h1>문제 삭제</h1>
      <div className='category'>
        <h3>1. 카테고리 선택 및 문제 검색</h3>
        <select name="cateSelect" value={subject} onChange={handleCategoryChange}>
          {subjects.map((subject, index) => (
            <option key={index} value={subject}>
              {subject}
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
              handleSearchQuest(1);
            }
          }}
        />
        <button onClick={() => handleSearchQuest(1)} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults'>
          <h3>검색 결과 ({searchResults.length}개): 문제를 클릭하여 상세 정보를 확인하거나 체크박스를 선택하여 삭제하세요.</h3>
          <ul>
            {searchResults.map((quest) => (
              <React.Fragment key={quest.id}>
                <li
                  onClick={() => handleQuestListItemClick(quest)}
                  className={selectedQuestionsToDelete.has(quest.id) ? 'selected-delete' : ''}
                >
                  <input
                    type="checkbox"
                    checked={selectedQuestionsToDelete.has(quest.id)}
                    onChange={(e) => handleCheckboxChange(e, quest.id)}
                  />
                  <span className="quest-id">[ID: {quest.id}]</span>
                  {quest.question_text.length > 80 ? quest.question_text.substring(0, 80) + '...' : quest.question_text}
                </li>
                {/* 선택된 문제 정보가 해당 문제 칸 아래에 드롭다운 형태로 표시 */}
                {selectedQuestId === quest.id && (
                  <div className='question-detail-form dropdown-content'>
                    <h2>선택된 <strong>{quest.id}</strong>번 문제 정보</h2>
                    <div className='questionText'>
                      <h3>문제 본문</h3>
                      <div className="read-only-field">
                        {quest.question_text}
                      </div>
                    </div>
                    <div className='option'>
                      <h3>선택지</h3>
                      {['option_1', 'option_2', 'option_3', 'option_4'].map((optionKey, index) => (
                        <div key={index}>
                          <div className="read-only-field">
                            {index + 1}. {quest[optionKey]}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='corAnswer'>
                      <h3>정답</h3>
                      <div className="read-only-field">
                        {quest.correct_answer}
                      </div>
                    </div>
                    <div className="photo-input-section">
                      <h3 className="section-title">이미지</h3>
                      <div className="image-preview-container">
                      {quest.image_data_base64 ? (
                        <div>
                          <img src={`data:image/png;base64,${quest.image_data_base64}`} alt="문제 이미지" className="image-preview"/>
                        </div>
                      ) : (
                        <div className="no-image-message">
                          첨부된 이미지가 없습니다.
                        </div>
                      )}
                      </div>
                    </div>
                    <div className="button-group">
                      <button onClick={handleDeleteSelectedQuests} className="delete-button">선택된 문제 삭제</button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              {/* 이전 페이지 블록 버튼 */}
              <button
                onClick={() => {
                  const newStartPage = Math.max(1, startPage - pagesToShow);
                  setStartPage(newStartPage);
                  handleSearchQuest(newStartPage);
                }}
                disabled={startPage === 1}
                className="pagination-button"
              >
                이전
              </button>
              {/* 페이지 번호들 */}
              {Array.from({ length: pagesToShow }, (_, i) => startPage + i)
                .filter(pageNumber => pageNumber <= totalPages)
                .map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => handleSearchQuest(pageNumber)}
                    className={currentPage === pageNumber ? 'active pagination-button' : 'pagination-button'}
                  >
                    {pageNumber}
                  </button>
                ))}
              {/* 다음 페이지 블록 버튼 */}
              <button
                onClick={() => {
                  const newStartPage = startPage + pagesToShow;
                  setStartPage(newStartPage);
                  handleSearchQuest(newStartPage); // 다음 블록의 첫 페이지로 검색
                }}
                disabled={startPage + pagesToShow > totalPages}
                className="pagination-button"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default QuestDelete;