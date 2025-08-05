import React, { useState } from 'react';
import '../css/adminsidebar.css';  

const UserAdminSidebar = ({setActiveUserMenu}) => {
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  
  const toggleAuthMenu = () => {
    setIsAuthMenuOpen(!isAuthMenuOpen);
  }

  return (
    <div>
      <button className='AuthMenu' onClick={toggleAuthMenu}>유저 관리 {isAuthMenuOpen ? '▼' : '▶'}</button>
      {isAuthMenuOpen && (
        <ul className="submenu-list">
          <li><button className="userRestrictBtn" onClick={()=> setActiveUserMenu('userRestrict')}>유저 제재</button></li>
          <li><button className="userRestrictBtn" onClick={()=> setActiveUserMenu('reportDetails')}>신고 내역</button></li>
        </ul>
      )}
    </div>
  );
};

export default UserAdminSidebar;