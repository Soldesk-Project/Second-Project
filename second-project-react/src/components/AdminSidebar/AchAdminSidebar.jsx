import React, { useState } from 'react';
import '../../css/adminsidebar.css';

const AchAdminSidebar = ({setActiveAchMenu}) => {
    const [isAchMenuOpen, setIsAchMenuOpen] = useState(false);

    const toggleAchMenu = () => {
      setIsAchMenuOpen(!isAchMenuOpen);
  };
  
  return (
    <div>
      <button className='AchMenu' onClick={toggleAchMenu}>업적 관리 {isAchMenuOpen ? '▼' : '▶'}</button><br/>
      {isAchMenuOpen && (
        <ul className="submenu-list">
          <li><button className="questRegisterBtn" onClick={()=> setActiveAchMenu('register')}>업적 등록</button></li>
          <li><button className="questDeleteBtn" onClick={()=> setActiveAchMenu('delete')}>업적 삭제</button></li>
        </ul>
      )}
    </div>
  );
};

export default AchAdminSidebar;