import React, { useState, useEffect } from 'react';
import Header from '../../layout/Header';
import styles from '../../css/customer.module.css';
import { useLocation } from 'react-router-dom';

import NoticePanel from '../../components/CustomerCenterComp/NoticePanel';
import FaqPanel from '../../components/CustomerCenterComp/FaqPanel';
import InquiryPanel from '../../components/CustomerCenterComp/InquiryPanel';
import QuestRequestPanel from '../../components/CustomerCenterComp/QuestRequestPanel';

const CustomerServiceCenter = () => {
  const location = useLocation();
  const tabs = ['공지사항', 'FAQ', '문제 등록 요청', '1:1 문의'];

  const [activeTab, setActiveTab] = useState(tabs[0]);

  // location.state가 바뀔 때마다 activeTab 재설정
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [location.state?.initialTab]);

  return (
    <div className={styles.customerServiceCenter}>
      <div className={styles.topNav}>
        <Header/>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${tab === activeTab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tabPanels}>
        {activeTab === '공지사항' && <NoticePanel />}
        {activeTab === 'FAQ' && <FaqPanel />}
        {activeTab === '문제 등록 요청' && <QuestRequestPanel />}
        {activeTab === '1:1 문의' && <InquiryPanel activeTab={activeTab} />}
      </div>
    </div>
  );
};

export default CustomerServiceCenter;
