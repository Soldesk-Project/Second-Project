import React, { useEffect, useRef, useState } from 'react';
import '../../css/adminPage/Edit.css';
import { useDispatch } from 'react-redux';
import { fetchUserItems } from '../../store/shopSlice';

const ItemEdit = () => {
  const dispatch = useDispatch();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [type, setType] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItemNo, setSelectedItemNo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [startPage, setStartPage] = useState(1);
  const pagesToShow = 5;
  const token = localStorage.getItem('token');

  const lastSearchQuery = useRef('');

  const types = [
    '전체', '테두리', '칭호', '글자색', '명함', '말풍선', '유니크'
  ];

  const typeTableMap = {
    '전체': 'all',
    '테두리': 'boundary',
    '칭호': 'title',
    '글자색': 'fontColor',
    '명함': 'background',
    '말풍선': 'balloon',
    '유니크': 'unique'
  };

  useEffect(() => {
    handleSearchItem(1);
  }, []);

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setSearchQuery('');
    setSelectedItemNo(null);
    handleReset();
    lastSearchQuery.current = '';
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setSelectedImage(null);
      setPreviewImage(null);
    }
  };

  const handleSearchItem = async (page = 1) => {
    const tableName = typeTableMap[type];
    if (!tableName) return;

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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
      console.error('아이템 검색 중 오류:', error);
      setSearchResults([]);
      setTotalPages(1);
      setCurrentPage(1);
      setStartPage(1);
    }
  };

  const handleSelectItem = (item) => {
    if (selectedItemNo === item.item_no) {
      setSelectedItemNo(null); // 같은 아이템 클릭 시 닫기
      handleReset();
    } else {
      setSelectedItemNo(item.item_no);
      setItemName(item.item_name);
      setItemPrice(item.item_price);
      if (item.imageFileName) {
        setSelectedImage(null);
        setPreviewImage(`/images/${item.imageFileName}`);
      } else {
        setPreviewImage(null);
        setSelectedImage(null);
      }
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItemNo) return;
    if (!window.confirm(`아이템 번호 ${selectedItemNo}를 정말 삭제하시겠습니까?`)) return;

    const tableName = typeTableMap[type];
    try {
      const response = await fetch(`/admin/deleteItems?type=${encodeURIComponent(tableName)}&itemNo=${selectedItemNo}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert('아이템이 삭제되었습니다.');
        handleReset();
        setSearchResults([]);
        setSearchQuery('');
        setSelectedItemNo(null);
        handleSearchItem(currentPage);
        dispatch(fetchUserItems());
      }
    } catch (error) {
      console.error('아이템 삭제 오류:', error);
    }
  };

  const handleItemEditSubmit = async () => {
    if (!selectedItemNo || !itemName.trim() || !itemPrice || !selectedImage) {
      alert('모든 항목을 입력해주세요.');
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
        handleSearchItem(currentPage);
        dispatch(fetchUserItems());
      }
    } catch (error) {
      console.error('아이템 수정 오류:', error);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setItemName('');
    setItemPrice('');
    setSelectedItemNo(null);
  };

  return (
    <div>
      <h1 className='edit-title'>아이템 수정</h1>
      <div className='category'>
        <h3>1. 타입 선택 및 아이템 검색</h3>
        <select name="typeSelect" value={type} onChange={handleTypeChange}>
          {types.map((type, index) => (
            <option key={index} value={type}>{type}</option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="아이템 이름 검색어를 입력하세요."
          onKeyPress={(e) => { if (e.key === 'Enter') handleSearchItem(1); }}
        />
        <button onClick={() => handleSearchItem(1)} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults'>
          <h3>검색 결과 ({searchResults.length}개): 아이템을 클릭하여 수정하세요.</h3>
          <ul>
            {searchResults.map((item) => (
              <React.Fragment key={item.item_no}>
                <li
                  onClick={() => handleSelectItem(item)}
                  className={selectedItemNo === item.item_no ? 'selected-edit' : ''}
                >
                  <span className="item-no">[{item.item_no}]</span>
                  {item.item_name.length > 80 ? item.item_name.substring(0, 80) + '...' : item.item_name}
                </li>
                {selectedItemNo === item.item_no && (
                  <div className='item-detail-form dropdown-content'>
                    <div className='itemName'>
                      <h3>1. 아이템 이름</h3>
                      <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} style={{ marginBottom: '10px' }} />
                    </div>
                    <div className='itemPrice'>
                      <h3>2. 아이템 가격</h3>
                      <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={{ marginBottom: '10px' }} />
                    </div>
                    <div className="photo-input-section">
                      <h3>3. 이미지 업로드</h3>
                      <input type="file" accept="image/*" onChange={handleImageChange} />
                      {previewImage && <img src={previewImage} alt="Preview" className="image-preview" />}
                    </div>
                    <div className="button-group">
                      <button type="button" onClick={handleReset} className="reset-button">현재 내용 초기화</button>
                      <button type="button" onClick={handleItemEditSubmit} className="submit-button">수정 완료</button>
                      <button type="button" onClick={handleDeleteItem} className="delete-button">삭제</button>
                    </div>
                  </div>
                )}
              </React.Fragment>
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

            {/* 페이지 번호 버튼들 */}
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
    </div>
  );
};

export default ItemEdit;
