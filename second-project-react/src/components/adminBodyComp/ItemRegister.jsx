import React, { useState } from 'react';
import '../../css/adminPage/Register.css';

const ItemRegister = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [type, setType] = useState('테두리');
  const [base64ImageString, setBase64ImageString] = useState('');

  const types = [
    '테두리',
    '칭호',
    '글자색',
    '배경',
    '말풍선',
    '랜덤박스',
  ];

  const typeTableMap = {
    '테두리' : 'boundaries',
    '칭호': 'titles',
    '글자색' : 'textColors',
    '배경' : 'wallpapers',
    '말풍선' : 'speechBubbles',
    '랜덤박스' : 'randomBoxes',
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
  };

  // 이미지 선택 핸들러
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
  };if (!itemName.trim()) {
        alert('문제 본문을 입력해주세요.');
        return;
      }

  // 전체 아이템 등록 제출 핸들러
  const handleQuestRegisterSubmit = async () => {
    // 필수 입력 필드 검증
    if (!type.trim()) {
      alert('아이템 타입 선택해주세요.');
      return;
    }
    if (!itemName.trim()) {
      alert('아이템 이름을 입력해주세요.');
      return;
    }
    if (!itemPrice.trim()) {
      alert('아이템 가격을 입력해주세요.');
      return;
    }

    // 백엔드로 보낼 때는 맵에서 변환된 테이블 이름을 사용
    const tableName = typeTableMap[type];
    if (!tableName) {
      alert('유효하지 않은 타입입니다.');
      return;
    }

    const itemData = {
      item_name: itemName,
      item_price: itemPrice,
      image_data_base64: base64ImageString,
    };

    try {
      const response = await fetch(`/admin/registerItem?type=${encodeURIComponent(tableName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        alert('아이템 등록 성공!');
        handleReset(); // 성공 시 폼 초기화
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('아이템 등록 실패 상세:', errorData);
          alert('아이템 등록 실패: ' + (errorData.message || '알 수 없는 오류'));
        }
      }
    } catch (error) {
      console.error('아이템 등록 오류:', error);
      alert('아이템 등록 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setItemName('');
    setType('테두리');
    setItemPrice('');
    setBase64ImageString('');
  };

  return (
    <div className="item-register-container">
      <h1 className="item-register-title">문제 등록</h1>
      
      <div className='type-section'>
        <h3 className="section-title">1. 타입 선택</h3>
        <select name="typeSelect" value={type} onChange={handleTypeChange} className="itemType-select">
          {types.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      
      <div className='item-Name-section'>
        <h3 className="section-title">2. 아이템 이름 입력</h3>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="item-Name-input"
          placeholder="아이템 이름을 입력하세요."
        />
      </div>

      <div className='item-Price-section'>
        <h3 className="section-title">2. 아이템 가격 입력</h3>
        <input
          type="number"
          value={itemPrice}
          onChange={(e) => setItemPrice(e.target.value)}
          className="item-Price-input"
          placeholder="아이템 가격을 숫자로 입력하세요."
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
        <button onClick={handleReset} className="reset-button">초기화</button>
        <button onClick={handleQuestRegisterSubmit} className="submit-button">제출</button>
      </div>
    </div>
  );
};

export default ItemRegister;