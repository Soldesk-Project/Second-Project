import React, { useState } from 'react';
import '../css/adminsidebar.css';

const ServerAdminSidebar = ({setActiveServerMenu}) => {
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);

  const toggleServerMenu = () => {
    setIsServerMenuOpen(!isServerMenuOpen);
  };

  return (
    <div>
      <button className='AchMenu' onClick={toggleServerMenu}>서버 데이터 {isServerMenuOpen ? '▼' : '▶'}</button><br/>
      {isServerMenuOpen && (
        <ul className="submenu-list">
          <li><button className="achRegisterBtn" onClick={()=> setActiveServerMenu('meta-data')}>meta-data</button></li>
          <li><button className="achRegisterBtn" onClick={()=> setActiveServerMenu('dynamic-data')}>dynamic-data</button></li>
        </ul>
      )}
    </div>
  );
};

export default ServerAdminSidebar;