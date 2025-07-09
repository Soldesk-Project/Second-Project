import React from 'react';
import Header from '../layout/Header';
import AdminSidebar from '../components/AdminSidebar';
import Headerstyles from '../css/MainPage.module.css';
import styles from '../css/AdminPage.module.css';

const AdminPage = () => {
  
  
  return (
    <div className={styles.container}>
      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={Headerstyles.top_nav}><Header/></div>
      <div className={styles.top_nav}>
        <button className="QnaAdminBtn">문제관리</button>
        <button className="">유저관리</button>
        관리자 님
      </div>
      {/*메인 바디 */}
      <div className={styles.body}>
        {/*좌측 바*/}
        <div className={styles.body_left}>
          <div className={AdminSidebar}>
            ㄴㄹㄴㅇㄻㄴㅇㄹ
          </div>
        </div>
        {/* 우측 본문*/}
        <div className={styles.body_content}>
          sdafsdfsdafsdfsa
        </div>
      </div>  
    </div>
  );
};

export default AdminPage;