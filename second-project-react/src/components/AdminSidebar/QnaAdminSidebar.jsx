import React, { useState } from 'react';
import '../../css/adminsidebar.css';

const QnaAdminSidebar = ({setActiveQnaMenu}) => {
  const [isDbMenuOpen, setIsDbMenuOpen] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);

  const toggleDbMenu = () => {
    setIsDbMenuOpen(!isDbMenuOpen);
  };
  const toggleReportMenu = () => {
    setIsReportMenuOpen(!isReportMenuOpen);
  }

  return (
    <div>
      <button className='DbMenu' onClick={toggleDbMenu}>문제 DB 관리 {isDbMenuOpen ? '▼' : '▶'}</button><br/>
      {isDbMenuOpen && (
        <ul className="submenu-list">
          <li><button className="questRegisterBtn" onClick={()=> setActiveQnaMenu('register')}>문제 등록</button></li>
          <li><button className="questEditBtn" onClick={()=> setActiveQnaMenu('edit')}>문제 수정</button></li>
          <li><button className="questDeleteBtn" onClick={()=> setActiveQnaMenu('delete')}>문제 삭제</button></li>
        </ul>
      )}
      <button className='ReportMenu' onClick={toggleReportMenu}>문제 제보 관리 {isReportMenuOpen ? '▼' : '▶'}</button>
      {isReportMenuOpen && (
        <ul className="submenu-list">
          <li><button className="questRegiCallManageBtn" onClick={()=> setActiveQnaMenu('regiCallManage')}>문제 등록 요청 관리</button></li>
          <li><button className="questErrRepoManageBtn" onClick={()=> setActiveQnaMenu('errReportManage')}>문제 오류 제보 관리</button></li>
        </ul>
      )}
    </div>
  );
};

export default QnaAdminSidebar;