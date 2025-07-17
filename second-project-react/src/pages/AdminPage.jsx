import React, { useState } from 'react';
import Header from '../layout/Header';
import QnaAdminSidebar from '../components/AdminSidebar/QnaAdminSidebar';
import UserAdminSidebar from '../components/AdminSidebar/UserAdminSidebar';
import Headerstyles from '../css/MainPage.module.css';
import styles from '../css/adminPage/AdminPage.module.css';
import { useSelector } from 'react-redux';
import QuestRegister from '../components/adminBodyComp/QuestRegister';
import QuestEdit from '../components/adminBodyComp/QuestEdit';
import QuestDelete from '../components/adminBodyComp/QuestDelete';
import QuestRegiCallManage from '../components/adminBodyComp/QuestRegiCallManage';
import QuestErrRepoManage from '../components/adminBodyComp/QuestErrRepoManage';
import UserInfoView from '../components/adminBodyComp/UserInfoView';
import LoginRecordView from '../components/adminBodyComp/LoginRecordView';
import UserRestrict from '../components/adminBodyComp/UserRestrict';

const AdminPage = () => {
  const currentUser = useSelector((state) => state.user.user);
  const userNick = currentUser?.user_nick;
  const [activeSidebar, setActiveSidebar] = useState('qna');
  // Q&A 관리 메뉴의 현재 활성화된 페이지 상태
  const [activeQnaMenu, setActiveQnaMenu] = useState('default');
  const [activeUserMenu, setActiveUserMenu] = useState('default');

  const setPageQnaAdmin = () => {
    setActiveSidebar('qna');
    setActiveQnaMenu('default');
  };
  const setpageUserAdmin = () => {
    setActiveSidebar('user');
    setActiveUserMenu('default');
  };

  // activeQnaMenu 값에 따라 렌더링할 컴포넌트를 결정하는 함수
  const renderQnaContent = () => {
    switch (activeQnaMenu) {
      case 'register':
        return <QuestRegister/>;
      case 'edit':
        return <QuestEdit/>;
      case 'delete':
        return <QuestDelete/>;
      case 'regiCallManage':
        return <QuestRegiCallManage />;
      case 'errReportManage':
        return <QuestErrRepoManage/>;
      default:
        return <QuestRegister/>;
    }
  };

  //activeUserMenu 값에 따라 렌더링할 컴포넌트를 결정하는 함수
  const renderUserContent = () => {
    switch (activeUserMenu){
      case 'infoView':
        return <UserInfoView/>;
      case 'loginRecordView':
        return <LoginRecordView/>;
      case 'userRestrict':
        return <UserRestrict/>;
      default:
        return <UserInfoView/>;
    }
  };

  return (
    <div className={styles.container}>
      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={Headerstyles.top_nav}><Header /></div>
      <div className={styles.top_nav}>
        <button className="QnaAdminBtn" onClick={setPageQnaAdmin}>문제/제보관리</button>
        <button className="UserAdminBtn" onClick={setpageUserAdmin}>유저/권한관리</button>
        <span>관리자 {userNick} 님</span>
      </div>
      {/*메인 바디 */}
      <div className={styles.body}>
        {/*좌측 바*/}
        <div className={styles.body_left}>
          {/* activeSidebar 값에 따라 다른 사이드바 컴포넌트를 조건부 렌더링*/}
          {activeSidebar === 'qna' && <QnaAdminSidebar setActiveQnaMenu={setActiveQnaMenu} />}
          {activeSidebar === 'user' && <UserAdminSidebar setActiveUserMenu={setActiveUserMenu}/>}
        </div>
        {/* 우측 본문*/}
        <div className={styles.body_content}>
          {activeSidebar === 'qna' && renderQnaContent()}
          {activeSidebar === 'user' && renderUserContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;