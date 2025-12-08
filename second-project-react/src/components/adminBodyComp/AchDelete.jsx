import React, { useEffect, useRef, useState } from 'react';

const AchieveDelete = () => {
  const [selectedAchTitle, setSelectedAchTitle] = useState(null);
  const [originalAchTitle, setOriginalAchTitle] = useState(null);
  const [achType, setAchType] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAchData, setSelectedAchData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [startPage, setStartPage] = useState(1);
  const pagesToShow = 5;
  const token = localStorage.getItem('token');

  const lastSearchQuery = useRef('');

  // 타입 선택 관련
  const achTypes = [
    '전체',
    '티어',
    '게임 플레이',
    '게임 1등',
  ];

  const tableType = {
    '전체': 'all',
    '티어': 'tier',
    '게임 플레이': 'gamePlay',
    '게임 1등': 'game1st',
  };

  useEffect(() => {
    handleSearchAch(1); // 페이지 진입 시 최초 1페이지 전체 업적 로드
  }, []);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setAchType(newType);
    setSearchQuery('');
    setSelectedAchTitle(null);
    setSelectedAchData(null);
    setCurrentPage(1);
    setTotalPages(1);
    setStartPage(1);

    handleSearchAch(1, newType);
  };

  const handleSearchAch = async (page = 1, passedType = null) => {
    const typeValue = tableType[passedType ?? achType];

    if (searchQuery !== lastSearchQuery.current || page === 1) {
      setStartPage(1);
    }
    lastSearchQuery.current = searchQuery;

    try {
      const response = await fetch(`api/admin/searchAchievements?type=${encodeURIComponent(typeValue)}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`, {
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
      setSearchResults(data.achievements);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

      if (page < startPage || page >= startPage + pagesToShow) {
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

  // 목록 클릭 시 해당 업적 선택
  const handleAchListItemClick = (achievement) => {
    setSelectedAchTitle(achievement.ach_title);
    setOriginalAchTitle(achievement.ach_title);
    setSelectedAchData(achievement);
  };

  // 삭제 버튼 클릭 시 단일 삭제 처리
  const handleDeleteSelectedAch = async () => {
    if (!selectedAchData) {
      alert('삭제할 업적이 선택되지 않았습니다.');
      return;
    }

    if (!window.confirm(`"${selectedAchData.ach_title}" 업적을 정말 삭제하시겠습니까?`)) {
      return;
    }

    const typeValue = tableType[achType];
    const encodedType = encodeURIComponent(typeValue);
    const encodedTitle = encodeURIComponent(selectedAchData.ach_title);

    const url = `api/admin/deleteAchievements?type=${encodedType}&title=${encodedTitle}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          // "Content-Type": "application/json",
        }
      });

      if (response.ok) {
        alert('업적이 성공적으로 삭제되었습니다.');
        setSelectedAchData(null);
        setSelectedAchTitle(null);
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

  // 수정 버튼 클릭
  const handleUpdateAchievement = async () => {
    if (!selectedAchData) return;

    if (!window.confirm('이 업적을 수정하시겠습니까?')) return;

    try {
      const response = await fetch(`api/admin/updateAchievement`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedAchData,
          originalTitle: originalAchTitle,
        })
      });

      if (response.ok) {
        alert('업적이 성공적으로 수정되었습니다.');
        handleSearchAch(currentPage);
      } else {
        const err = await response.text();
        alert(`업적 수정 실패: ${err}`);
      }
    } catch (err) {
      console.error('업적 수정 중 오류 발생:', err);
      alert('업적 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h1 style={{    color: '#fff',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2em'}}>업적 수정 및 삭제</h1>
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
          placeholder="업적 이름 또는 내용 검색"
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
          <h3>검색 결과 ({searchResults.length}개): 목록에서 업적을 클릭하세요.</h3>
          <ul>
          {searchResults.map((ach) => (
            <React.Fragment key={ach.ach_title}>
              <li
                onClick={() => handleAchListItemClick(ach)}
                className={selectedAchTitle === ach.ach_title ? 'selected-edit' : ''}
              >
                [{ach.ach_title}]
              </li>

              {selectedAchTitle === ach.ach_title && selectedAchData && (
                <div className="achievement-detail-form dropdown-content">

                  <h3>1. 업적 이름</h3>
                  <input
                    type="text"
                    value={selectedAchData.ach_title}
                    onChange={(e) =>
                      setSelectedAchData((prev) => ({ ...prev, ach_title: e.target.value }))
                    }
                    style={{ marginBottom: '10px' }}
                  />

                  <h3>2. 업적 내용</h3>
                  <input
                    type="text"
                    value={selectedAchData.ach_content}
                    onChange={(e) =>
                      setSelectedAchData((prev) => ({ ...prev, ach_content: e.target.value }))
                    }
                    style={{ marginBottom: '10px' }}
                  />

                  <h3>3. 업적 보상</h3>
                  <input
                    type="text"
                    value={selectedAchData.ach_reward}
                    onChange={(e) =>
                      setSelectedAchData((prev) => ({ ...prev, ach_reward: e.target.value }))
                    }
                    style={{ marginBottom: '10px' }}
                  />

                  <div className="button-group">
                    <button
                      onClick={handleUpdateAchievement}
                      className="ach-update-button"
                      style={{ marginRight: '10px' }}
                    >
                      업적 수정
                    </button>
                    <button onClick={handleDeleteSelectedAch} className="delete-button">
                      업적 삭제
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </ul>
          {totalPages > 1 && (
            <div className="pagination">
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
              <button
                onClick={() => {
                  const newStartPage = startPage + pagesToShow;
                  setStartPage(newStartPage);
                  handleSearchAch(newStartPage);
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

export default AchieveDelete;
