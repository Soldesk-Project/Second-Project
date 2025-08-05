import React, { useState } from 'react';
import Header from '../layout/Header';
import QuestAdminSidebar from '../layout/QuestAdminSidebar';
import UserAdminSidebar from '../layout/UserAdminSidebar';
import Headerstyles from '../css/MainPage.module.css';
import styles from '../css/adminPage/AdminPage.module.css';
import { useSelector } from 'react-redux';
import QuestRegister from '../components/adminBodyComp/QuestRegister';
import QuestEdit from '../components/adminBodyComp/QuestEdit';
import QuestDelete from '../components/adminBodyComp/QuestDelete';
import QuestRegiCallManage from '../components/adminBodyComp/QuestRegiCallManage';
import QuestErrRepoManage from '../components/adminBodyComp/QuestErrRepoManage';
import UserRestrict from '../components/adminBodyComp/UserRestrict';
import AchAdminSidebar from '../layout/AchAdminSidebar';
import AchRegister from '../components/adminBodyComp/AchRegister';
import AchDelete from '../components/adminBodyComp/AchDelete';
import ItemRegister from '../components/adminBodyComp/ItemRegister';
import ItemEdit from '../components/adminBodyComp/ItemEdit';
import ItemDelete from '../components/adminBodyComp/ItemDelete';
import ReportDetails from '../components/adminBodyComp/ReportDetails';

const AdminPage = () => {
  const currentUser = useSelector((state) => state.user.user);
  const userNick = currentUser?.user_nick;
  const [activeSidebar, setActiveSidebar] = useState('quest');
  // Q&A 관리 메뉴의 현재 활성화된 페이지 상태
  const [activeQuestMenu, setActiveQuestMenu] = useState('default');
  const [activeUserMenu, setActiveUserMenu] = useState('default');
  const [activeAchMenu, setActiveAchMenu] = useState('default');
  const [activeTab, setActiveTab] = useState('quest');

  const setPageQuestAdmin = () => {
    setActiveSidebar('quest');
    setActiveQuestMenu('default');
  };
  const setpageUserAdmin = () => {
    setActiveSidebar('user');
    setActiveUserMenu('default');
  };
  const setPageAchAdmin = () => {
    setActiveSidebar('achievement');
    setActiveAchMenu('default');
  }

  // activeQuestMenu 값에 따라 렌더링할 컴포넌트를 결정하는 함수
  const renderQuestContent = () => {
    switch (activeQuestMenu) {
      case 'questRegister':
        return <QuestRegister/>;
      case 'questEdit':
        return <QuestEdit/>;
      case 'questDelete':
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
      case 'userRestrict':
        return <UserRestrict/>;
      case 'reportDetails':
        return <ReportDetails/>;
      default:
        return <UserRestrict/>;
    }
  };

  //activeAchieveMenu 값에 따라 렌더링할 컴포넌트를 결정하는 함수
  const renderAchContent = () => {
    switch (activeAchMenu){
      case 'achRegister' :
        return <AchRegister/>;
      case 'achDelete' :
        return <AchDelete/>;
      case 'itemRegister' : 
        return <ItemRegister/>;
      case 'itemEdit' : 
        return <ItemEdit/>;
      case 'itemDelete' : 
        return <ItemDelete/>;
      default:
        return <AchRegister/>;
    }
  }

  return (
    <div className={styles.container}>
      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={Headerstyles.top_nav}><Header /></div>
        <div className={styles.top_nav}>
          <div className={styles.nav_buttons}>
            <button className={`${styles.top_nav_button} ${activeTab === 'quest' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('quest'); setPageQuestAdmin(); }}>
              문제/제보관리
            </button>
            <button className={`${styles.top_nav_button} ${activeTab === 'user' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('user'); setpageUserAdmin(); }}>
              유저권한관리
            </button>
            <button className={`${styles.top_nav_button} ${activeTab === 'ach' ? styles.activeTab : ''}`} onClick={() => { setActiveTab('ach'); setPageAchAdmin(); }}>
              업적/상점관리
            </button>
          </div>
        </div>
      {/*메인 바디 */}
      <div className={styles.body}>
        {/*좌측 바*/}
        <div className={styles.body_left}>
          {/* activeSidebar 값에 따라 다른 사이드바 컴포넌트를 조건부 렌더링*/}
          {activeSidebar === 'quest' && <QuestAdminSidebar setActiveQuestMenu={setActiveQuestMenu} />}
          {activeSidebar === 'user' && <UserAdminSidebar setActiveUserMenu={setActiveUserMenu}/>}
          {activeSidebar === 'achievement' && <AchAdminSidebar setActiveAchMenu={setActiveAchMenu}/>}
        </div>
        {/* 우측 본문*/}
        <div className={styles.body_content}>
          {activeSidebar === 'quest' && renderQuestContent()}
          {activeSidebar === 'user' && renderUserContent()}
          {activeSidebar === 'achievement' && renderAchContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;