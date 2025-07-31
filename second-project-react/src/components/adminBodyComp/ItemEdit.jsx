import React, { useRef, useState } from 'react';
import '../../css/adminPage/Edit.css';

const ItemEdit = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [type, setType] = useState('테두리');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItemNo, setSelectedItemNo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const [startPage, setStartPage] = useState(1);
    const pagesToShow = 5;
    const token = localStorage.getItem('token');
  
    // 이전 검색어를 저장할 useRef (searchQuery가 변경되었는지 확인하기 위함)
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
      handleReset();
      setCurrentPage(1);
      setTotalPages(1);
      setStartPage(1);
      lastSearchQuery.current = '';
    };
  
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
        // itemsPerPage를 서버 요청에 사용
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
      setItemName(item.item_name);
      setItemPrice(item.item_price);
  
      if (item.imageFilename) {
            setSelectedImage(null);
            setPreviewImage(`/images/${item.imageFileName}`);
        } else {
            setPreviewImage(null);
            setSelectedImage(null);
        }
    };
  
    const handleItemEditSubmit = async () => {
      if (selectedItemNo === null) {
        alert('수정할 아이템을 먼저 선택해주세요.');
        return;
      }
      if (!type.trim()) {
      alert('아이템 타입 선택해주세요.');
      return;
      }
      if (!itemName.trim()) {
        alert('아이템 이름을 입력해주세요.');
        return;
      }
      if (itemPrice === null || itemPrice === undefined || isNaN(itemPrice) || itemPrice <= 0) {
        alert('아이템 가격을 입력해주세요.');
        return;
      }
      if (!selectedImage) {
        alert('아이템 이미지를 선택해주세요.');
        return;
      }
  
      const formData = new FormData();
      formData.append('item_no', selectedItemNo);
      formData.append('item_name', itemName);
      formData.append('item_price', itemPrice);
      formData.append('type', typeTableMap[type]);
      formData.append('item_image', selectedImage);

      let currentImageFileName = null;
      if (previewImage && typeof previewImage === 'string' && previewImage.startsWith('/images/')) {
        currentImageFileName = previewImage.substring('/images/'.length);
      }
      formData.append('original_image_file_name', currentImageFileName || '');
      console.log('수정할 아이템 데이터 (FormData):', Array.from(formData.entries()));
  
      try {
        const response = await fetch(`/admin/editItem`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
  
        if (response.ok) {
          alert('아이템 수정 성공!');
          handleReset();
          setSearchResults([]);
          setSearchQuery('');
          setSelectedItemNo(null);
          handleSearchItem(currentPage); // 수정 후 현재 페이지를 다시 불러와 목록 업데이트
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error('아이템 수정 실패 상세:', errorData);
            alert('아이템 수정 실패: ' + (errorData.message || '알 수 없는 오류'));
          } else {
            console.error('아이템 수정 실패: 서버 응답 형식 오류');
            alert('아이템 수정 실패: 서버 응답 오류. 콘솔을 확인하세요.');
          }
        }
      } catch (error) {
        console.error('아이템 수정 오류:', error);
        alert('아이템 수정 중 클라이언트 오류가 발생했습니다.');
      }
    };
  
    const handleReset = () => {
      setSelectedImage(null);
      setPreviewImage(null);
      setItemName('');
      setItemPrice('');
      setSelectedImage(null);
      setPreviewImage(null);
      setSelectedItemNo(null);
    };
  
    return (
      <div>
        <h1>아이템 수정</h1>
        <div className='category'>
          <h3>1. 타입 선택 및 아이템 검색</h3>
          <select name="typeSelect" value={type} onChange={handleTypeChange}>
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
          <div className='searchResults'> {/* 이 div에 CSS를 적용하여 스크롤 방지 */}
            <h3>검색 결과 ({searchResults.length}개): 아이템을 클릭하여 수정하세요.</h3>
            <ul>
              {searchResults.map((item) => (
                <li
                  key={item.item_no}
                  onClick={() => handleSelectItem(item)}
                  className={selectedItemNo === item.item_no ? 'selected-edit' : ''}
                >
                  <span className="item-no">[No: {item.item_no}]</span>
                  {item.item_name.length > 80 ? item.item_name.substring(0, 80) + '...' : item.item_name}
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="pagination">
                {/* 이전 버튼 */}
                <button
                  onClick={() => setStartPage(prev => Math.max(1, prev - pagesToShow))}
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
                      className={currentPage === pageNumber ? 'active pagination-button' : 'pagination-button'}
                    >
                      {pageNumber}
                    </button>
                  ))}
  
                {/* 다음 버튼 */}
                <button
                  onClick={() => setStartPage(prev => prev + pagesToShow)}
                  disabled={startPage + pagesToShow > totalPages}
                  className="pagination-button"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
  
        {selectedItemNo && (
          <>
            <hr />
            <div className='item-detail-form'>
              <h2>선택된 아이템 수정</h2>
              <p>선택된 아이템 번호: <strong>{selectedItemNo}</strong></p>
              <div className='itemName'>
                <h3>2. 아이템 이름 입력</h3>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="아이템 이름을 입력하세요."
                />
              </div>
              <div className='itemPrice'>
                <h3>2. 아이템 가격 입력</h3>
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="아이템 가격을 입력하세요."
                />
              </div>
              <div className="photo-input-section">
                <h3 className="section-title">4. 이미지 업로드</h3>
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
                <button onClick={handleItemEditSubmit} className="submit-button">수정 완료</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

export default ItemEdit;