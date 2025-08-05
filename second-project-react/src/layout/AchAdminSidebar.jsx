import React, { useState } from 'react';
import '../css/adminsidebar.css';

const AchAdminSidebar = ({setActiveAchMenu}) => {
  const [isAchMenuOpen, setIsAchMenuOpen] = useState(false);
  const [isItemMenuOpen, setIsItemMenuOpen] = useState(false);

  const toggleAchMenu = () => {
    setIsAchMenuOpen(!isAchMenuOpen);
  };

  const toggleItemMenu = () => {
    setIsItemMenuOpen(!isItemMenuOpen);
  };

  return (
    <div>
      <button className='AchMenu' onClick={toggleAchMenu}>업적 관리 {isAchMenuOpen ? '▼' : '▶'}</button><br/>
      {isAchMenuOpen && (
        <ul className="submenu-list">
          <li><button className="achRegisterBtn" onClick={()=> setActiveAchMenu('achRegister')}>업적 등록</button></li>
          <li><button className="achDeleteBtn" onClick={()=> setActiveAchMenu('achDelete')}>업적 삭제</button></li>
        </ul>
      )}
      <button className='ItemMenu' onClick={toggleItemMenu}>상점 아이템 관리 {isItemMenuOpen ? '▼' : '▶'}</button><br/>
      {isItemMenuOpen && (
        <ul className="submenu-list">
          <li><button className="itemRegisterBtn" onClick={()=> setActiveAchMenu('itemRegister')}>상점 아이템 등록</button></li>
          <li><button className="itemRegisterBtn" onClick={()=> setActiveAchMenu('itemEdit')}>상점 아이템 수정</button></li>
          {/* <li><button className="itemDeleteBtn" onClick={()=> setActiveAchMenu('itemDelete')}>상점 아이템 삭제</button></li> */}
        </ul>
      )}
    </div>
  );
};

export default AchAdminSidebar;