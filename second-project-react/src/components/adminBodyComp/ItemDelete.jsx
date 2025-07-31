import React, { useRef, useState } from 'react';
import '../../css/adminPage/Delete.css';

const ItemDelete = () => {
  const [type, setType] = useState('테두리');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemNo, setSelectedItemNo] = useState(null);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState(new Set());
  const [startPage, setStartPage] = useState(1);
  const pagesToShow = 5;
  const token = localStorage.getItem('token');

  const lastSearchQuery = useRef('');

  const types = [
    '테두리',
    '칭호',
    '글자색',
    '배경',
    '말풍선',
    '랜덤박스',
  ];

  const typeTableMap = {
    '테두리' : 'boundary',
    '칭호': 'title',
    '글자색' : 'textColor',
    '배경' : 'wallpaper',
    '말풍선' : 'speechBubble',
    '랜덤박스' : 'randomBoxe',
  };

  const handleTypeChange = (e) => {
      const selectedType = e.target.value;
      setType(selectedType);
      setSearchResults([]);
      setSearchQuery('');
      setSelectedItemNo(null);
      setSelectedItemData(null);
      setCurrentPage(1);
      setTotalPages(1);
      setStartPage(1);
      setSelectedItemsToDelete(new Set());
      lastSearchQuery.current = '';
    };

  const handleSearchItem = async (page = 1) => {
    const tableName = typeTableMap[type];
    if (!tableName) {
      alert('유효하지 않은 타입입니다.');
      return;
    }

    if (searchQuery !== lastSearchQuery.current || page === 1) {
        setStartPage(1);
    }
    lastSearchQuery.current = searchQuery;

    try {
      const response = await fetch(`/admin/searchItems?type=${tableName}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`, {
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

      const itemsWithImageUrl = data.items.map(item => ({
        ...item,
        imageUrl: item.imageFileName ? `/images/${item.imageFileName}` : null
      }));

      setSearchResults(itemsWithImageUrl);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

      if (page < startPage || page >= startPage + pagesToShow) {
        setStartPage(Math.floor((page - 1) / pagesToShow) * pagesToShow + 1);
      }
    } catch (error) {
      console.error('아이템 검색 중 오류 발생:', error);
      alert('아이템 검색 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      setSearchResults([]);
      setTotalPages(1);
      setCurrentPage(1);
      setStartPage(1);
    }
  };

  const handleSelectItem = (item) => {
      setSelectedItemNo(item.item_no);
      setSelectedItemData(item);
  };

  const handleCheckboxChange = (event, item_no) => {
    event.stopPropagation();
    setSelectedItemsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item_no)) {
        newSet.delete(item_no);
      } else {
        newSet.add(item_no);
      }
      return newSet;
    });
  };

  const handleDeleteSelectedItems = async () => {
    if (selectedItemsToDelete.size === 0) {
      alert('삭제할 아이템을 하나 이상 선택해주세요.');
      return;
    }

    if (!window.confirm(`${selectedItemsToDelete.size}개의 아이템을 정말 삭제하시겠습니까?`)) {
      return;
    }

    const tableName = typeTableMap[type];
    if (!tableName) {
      alert('유효하지 않은 타입입니다.');
      return;
    }

    try {
      const response = await fetch(`/admin/deleteItems?type=${encodeURIComponent(tableName)}&itemNos=${Array.from(selectedItemsToDelete).join(',')}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (response.ok) {
        alert('선택된 아이템이 성공적으로 삭제되었습니다.');
        setSelectedItemsToDelete(new Set());
        setSelectedItemNo(null);
        setSelectedItemData(null);
        handleSearchItem(currentPage); 
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('아이템 삭제 실패 상세:', errorData);
          alert('아이템 삭제 실패: ' + (errorData.message || '알 수 없는 오류'));
        } else {
          console.error('아이템 삭제 실패: 서버 응답 형식 오류');
          alert('아이템 삭제 실패: 서버 응답 오류. 콘솔을 확인하세요.');
        }
      }
    } catch (error) {
      console.error('아이템 삭제 중 클라이언트 오류:', error);
      alert('아이템 삭제 중 클라이언트 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h1>아이템 삭제</h1>
      <div className='category'>
        <h3>1. 타입 선택 및 아이템 검색</h3>
        <select name="cateSelect" value={type} onChange={handleTypeChange}>
          {types.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="아이템 이름 검색어를 입력하세요."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearchItem(1);
            }
          }}
        />
        <button onClick={() => handleSearchItem(1)} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults'>
          <h3>검색 결과 ({searchResults.length}개): 삭제할 아이템 선택하세요.</h3>
          <ul>
            {searchResults.map((item) => (
              <li
                key={item.item_no}
                onClick={() => handleSelectItem(item)}
                className={selectedItemsToDelete.has(item.item_no) ? 'selected-delete' : ''}
              >
                <input
                  type="checkbox"
                  checked={selectedItemsToDelete.has(item.item_no)}
                  onChange={(e) => handleCheckboxChange(e, item.item_no)}
                />
                <span className="item-no">[No: {item.item_no}]</span>
                {item.item_name.length > 80 ? item.item_name.substring(0, 80) + '...' : item.item_name}
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
                  handleSearchItem(newStartPage);
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
                    onClick={() => handleSearchItem(pageNumber)}
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
                  handleSearchItem(newStartPage); // 다음 블록의 첫 페이지로 검색
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

      {selectedItemData && (
        <>
          <hr />
          <div className='item-detail-form'>
            <h2>선택된 아이템 정보</h2>
            <p>선택된 아이템 번호: <strong>{selectedItemData.item_no}</strong></p>
            <div className='questionText'>
              <h3>아이템 이름</h3>
              <div className="read-only-field">
                {selectedItemData.item_name}
              </div>
            </div>
            <div className="photo-input-section">
              <h3 className="section-title">이미지</h3>
              <div className="image-preview-container">
              {selectedItemData.image_data_base64 ? (
                <div>
                  <img src={`data:image/png;base64,${selectedItemData.image_data_base64}`} alt="Image-preview" className="image-preview"/>
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
        <button onClick={handleDeleteSelectedItems} className="delete-button">선택된 아이템 삭제</button>
      </div>
    </div>
  );
};

export default ItemDelete;