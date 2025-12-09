import React, { useState } from 'react';
import '../../css/adminPage/Register.css';

const AchRegister = () => {
  const [achTitle, setAchTitle] = useState('');
  const [achContent, setAchContent] = useState('');
  const [achReward, setAchReward] = useState('');
  const [achType, setAchType] = useState('티어');
  const token = localStorage.getItem('token');

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
  }

  //전체 업적 등록 제출 핸들러
  const handleAchRegisterSubmit = async () => {
    //필수 입력 필드 검증
    if (!achType.trim()){
      alert('타입을 선택해주세요');
      return;
    }
    if (!achTitle.trim()){
      alert('제목을 입력해주세요');
      return;
    }
    if (!achContent.trim() || isNaN(achContent)){
      alert('내용(숫자)을 입력해주세요');
      return;
    }
    if (!achReward.trim() || isNaN(achContent)){
      alert('보상(숫자)을 입력해주세요');
      return;
    }

    const achData = {
      ach_title: achTitle,
      ach_content: parseInt(achContent, 10),
      ach_reward: parseInt(achReward, 10),
      ach_type: tableType[achType],
    };

    try {
      const response = await fetch(`api/admin/registerAchievement?`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(achData),
      });

      if (response.ok){
        alert('업적 등록 성공');
        handleReset();
      } else{
        const contentType = response.headers.get("content-type");
        if(contentType && contentType.includes("application/json")){
          const errorData = await response.json();
          console.error('업적 등록 실패 상세:', errorData);
          alert('업적 등록 실패:' + (errorData.message || '알 수 없는 오류'));
        }
      } 
    } catch (error) {
        console.error('업적 등록 오류:', error);
        alert('업적 등록 중 오류가 발생했습니다');
    }
  };

  const handleReset = () => {
    setAchTitle('');
    setAchContent('');
    setAchReward('');
    setAchType('티어');
  };

  return (
    <div className='achievement-register-container'>
      <h1 className='achievement-register-title'>업적 등록</h1>

      <div className='type-section'>
        <h3 className='section-title'>1. 타입 선택</h3>
        <select name='typeSelect' value={achType} onChange={handleTypeChange} className="achtype-select">
          {achTypes.map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className='ach-name-section'>
        <h3 className='section-title'>2. 업적 이름 입력</h3>
        <input
          type="text"
          value={achTitle}
          onChange={(e) => setAchTitle(e.target.value)}
          className='achievement-text-input'
          placeholder='업적 이름을 입력하세요.'
        />
      </div>
      
      <div className="ach-content-section">
        <h3 className='section-title'>3. 업적 내용 입력 
          {
            achType === '티어' ? ' - 요구 랭크 점수 입력' :
            achType === '게임 플레이' ? ' - 요구 플레이 횟수 입력' :
            achType === '게임 1등' ? ' - 1등 도달 횟수 입력' : ''
          }
        </h3>
        <input
    type="number"
    inputMode="numeric"
    min="0"
    value={achContent}
    onChange={(e) => setAchContent(e.target.value)}
    className="achievement-text-input"
    placeholder={
      achType === '티어' ? '예: 2000 (필요한 점수)' :
      achType === '게임 플레이' ? '예: 100 (필요한 플레이 횟수)' :
      achType === '게임 1등' ? '예: 10 (1등 달성 횟수)' :
      '업적 내용을 숫자로 입력하세요'
    }
  />
      </div>

      <div className='ach-reward-section'>
        <h3 className='section-title'>4. 업적 보상 입력 - point</h3>
        <input
          type='number'
          value={achReward}
          onChange={(e) => setAchReward(e.target.value)}
          className='achievement-text-input'
          placeholder='업적 보상을 숫자로 입력하세요'
        />
      </div>

      <div className='button-group'>
          <button onClick={handleReset} className='reset-button'>초기화</button>
          <button  onClick={handleAchRegisterSubmit} className='submit-button'>등록 완료</button>
      </div>
    </div>
  );
};

export default AchRegister;