import React, { useState } from 'react';
import '../../css/adminsidebar.css';  

const UserAdminSidebar = ({setActiveUserMenu}) => {
   const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  
  const toggleInfoMenu = () => {
    setIsInfoMenuOpen(!isInfoMenuOpen);
  };
  const toggleAuthMenu = () => {
    setIsAuthMenuOpen(!isAuthMenuOpen);
  }

  return (
    <div>
      <button className='InfoMenu' onClick={toggleInfoMenu}>유저 정보 관리 {isInfoMenuOpen ? '▼' : '▶'}</button><br/>
      {isInfoMenuOpen && (
        <ul className="submenu-list">
          <li><button className="userInfoViewBtn" onClick={()=> setActiveUserMenu('infoView')}>유저 정보 조회</button></li>
          <li><button className="loginRecordViewBtn" onClick={()=> setActiveUserMenu('loginRecordView')}>접속 기록 조회</button></li>
        </ul>
      )}
      <button className='AuthMenu' onClick={toggleAuthMenu}>유저 권한 관리 {isAuthMenuOpen ? '▼' : '▶'}</button>
      {isAuthMenuOpen && (
        <ul className="submenu-list">
          <li><button className="userRestrictBtn" onClick={()=> setActiveUserMenu('userRestrict')}>유저 제재</button></li>
        </ul>
      )}
    </div>
  );
};

export default UserAdminSidebar;