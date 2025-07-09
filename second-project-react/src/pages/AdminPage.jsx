import React, { useState } from 'react';
import Header from '../layout/Header';
import QnaAdminSidebar from '../components/AdminSidebar/QnaAdminSidebar';
import UserAdminSidebar from '../components/AdminSidebar/UserAdminSidebar';
import Headerstyles from '../css/MainPage.module.css';
import styles from '../css/AdminPage.module.css';
import { useSelector } from 'react-redux';

const AdminPage = () => {
  const currentUser = useSelector((state) => state.user.user);
  const userNick = currentUser?.user_nick;
  const [activeSidebar, setActiveSidebar] = useState('qna');
  
  const setPageQnaAdmin = () =>{
    setActiveSidebar('qna');
  }
  const setpageUserAdmin = () => {
    setActiveSidebar('user');
  }

  return (
    <div className={styles.container}>
      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={Headerstyles.top_nav}><Header/></div>
      <div className={styles.top_nav}>
        <button className="QnaAdminBtn" onClick={setPageQnaAdmin}>문제관리</button>
        <button className="UserAdminBtn" onClick={setpageUserAdmin}>유저관리</button>
        <span>관리자 {userNick} 님</span>
      </div>
      {/*메인 바디 */}
      <div className={styles.body}>
        {/*좌측 바*/}
        <div className={styles.body_left}>
          {/* activeSidebar 값에 따라 다른 사이드바 컴포넌트를 조건부 렌더링*/}
          {activeSidebar === 'qna' && <QnaAdminSidebar />}
          {activeSidebar === 'user' && <UserAdminSidebar />}
        </div>
        {/* 우측 본문*/}
        <div className={styles.body_content}>
          본문 내용을 적어주세요
        </div>
      </div>  
    </div>
  );
};

export default AdminPage;