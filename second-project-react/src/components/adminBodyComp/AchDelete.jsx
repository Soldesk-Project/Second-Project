import React, { useRef, useState } from 'react';

const AchieveDelete = () => {
  const [selectedAchTitle, setSelectedAchTitle] = useState(null);
  const [achType, setAchType] = useState('티어');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAchData, setSelectedAchData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [selectedAchsToDelete, setSelectedAchsToDelete] = useState(new Set());
  const [startPage, setStartPage] = useState(1);
  const pagesToShow = 5;

  const lastSearchQuery = useRef('');

  //타입 선택 관련
  const achTypes = [
    '티어',
    '게임 플레이',
    '게임 1등',
  ];

  const tableType = {
    '티어': 'tier',
    '게임 플레이': 'gamePlay',
    '게임 1등': 'game1st',
  };

  const handleTypeChange = (e) => {
    setAchType(e.target.value);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedAchTitle(null);
    setSelectedAchData(null);
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedAchsToDelete(new Set());
    setStartPage(1);
  }

  const handleSearchAch = async (page = 1) => {
    const typeValue = tableType[achType];

    if (searchQuery !== lastSearchQuery.current || page === 1){
      setStartPage(1);
    }
    lastSearchQuery.current = searchQuery;

    try {
      const response = await fetch(`/admin/searchAchievements?type=${encodeURIComponent(typeValue)}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`);
      if (!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.achievements);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

      if (page < startPage || page >= startPage + pagesToShow){
        setStartPage(Math.floor((page - 1) / pagesToShow) * pagesToShow + 1);
      }
    } catch (error) {
      console.error('업적 검색 중 오류 발생:', error);
      alert('업적 검색 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      setSearchResults([]);
      setTotalPages(1);
      setCurrentPage(1);
      setStartPage(1);
    }
  };

  const handleAchListItemClick = (achievement) => {
    setSelectedAchTitle(achievement.ach_title);
    setSelectedAchData(achievement);
  };

  const handleCheckboxChange = (event, achTitle) => {
    event.stopPropagation();
    setSelectedAchsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(achTitle)) {
        newSet.delete(achTitle);
      } else {
        newSet.add(achTitle);
      }
      return newSet;
    });
  };

  const handleDeleteSelectedAchs = async () => {
    console.log("현재 선택된 업적들:", selectedAchsToDelete);
    console.log("전송될 titles 문자열:", Array.from(selectedAchsToDelete).join(','));

    if (selectedAchsToDelete.size === 0) {
      alert('삭제할 업적을 하나 이상 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedAchsToDelete.size}개의 업적을 정말 삭제하시겠습니까?`)) {
      return;
    }

    const typeValue = tableType[achType];

    try {
      const response = await fetch(`/admin/deleteAchievements?type=${encodeURIComponent(typeValue)}&titles=${Array.from(selectedAchsToDelete).join(',')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('선택된 업적이 성공적으로 삭제되었습니다.');
        setSelectedAchsToDelete(new Set());
        setSelectedAchTitle(null);
        setSelectedAchData(null);
        handleSearchAch(currentPage); 
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('업적 삭제 실패 상세:', errorData);
          alert('업적 삭제 실패: ' + (errorData.message || '알 수 없는 오류'));
        } else {
          console.error('업적 삭제 실패: 서버 응답 형식 오류');
          alert('업적 삭제 실패: 서버 응답 오류. 콘솔을 확인하세요.');
        }
      }
    } catch (error) {
      console.error('업적 삭제 중 클라이언트 오류:', error);
      alert('업적 삭제 중 클라이언트 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h1>업적 삭제</h1>
      <div className='category'>
        <h3>1. 타입 선택 및 업적 검색</h3>
        <select name="cateSelect" value={achType} onChange={handleTypeChange}>
          {achTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
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
              handleSearchAch(1);
            }
          }}
        />
        <button onClick={() => handleSearchAch(1)} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults'>
          <h3>검색 결과 ({searchResults.length}개): 삭제할 업적을 선택하세요.</h3>
          <ul>
            {searchResults.map((ach) => (
              <li
                key={ach.ach_title}
                onClick={() => handleAchListItemClick(ach)}
                className={selectedAchsToDelete.has(ach.ach_title) ? 'selected-delete' : ''}
              >
                <input
                  type="checkbox"
                  checked={selectedAchsToDelete.has(ach.ach_title)}
                  onChange={(e) => handleCheckboxChange(e, ach.ach_title)}
                />
                <span className="quest-id">[ID: {ach.ach_title}]</span>
                {ach.ach_content.length > 80 ? ach.ach_content.substring(0, 80) + '...' : ach.ach_content}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              {/* 이전 페이지 블록 버튼 */}
              <button
                onClick={() => {
                  const newStartPage = Math.max(1, startPage - pagesToShow);
                  setStartPage(newStartPage);
                  handleSearchAch(newStartPage);
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
                    onClick={() => handleSearchAch(pageNumber)}
                    className={currentPage === pageNumber ? 'active' : ''}
                  >
                    {pageNumber}
                  </button>
                ))}
              {/* 다음 페이지 블록 버튼 */}
              <button
                onClick={() => {
                  const newStartPage = startPage + pagesToShow;
                  setStartPage(newStartPage);
                  handleSearchAch(newStartPage); // 다음 블록의 첫 페이지로 검색
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

      {selectedAchData && (
        <>
          <hr />
          <div className='achievement-detail-form'>
            <h2>선택된 업적 정보</h2>
            <p>선택된 업적 이름: <strong>{selectedAchData.ach_title}</strong></p>
            <div className='achContent'>
              <h3>업적 내용</h3>
              <div className="read-only-field">
                {selectedAchData.ach_content}
              </div>
            </div>
            <div className='achReward'>
              <h3>업적 보상</h3>
              <div className="read-only-field">
                {selectedAchData.ach_reward}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="button-group">
        <button onClick={handleDeleteSelectedAchs} className="delete-button">선택된 업적 삭제</button>
      </div>
    </div>
  );
};

export default AchieveDelete;