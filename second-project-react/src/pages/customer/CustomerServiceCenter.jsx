import React, { useState } from 'react';
import Header from '../../layout/Header'; // Header 컴포넌트 경로는 변경 없음 (상대 경로 기준)
import styles from '../../css/customer.module.css'; // CSS 모듈 경로는 변경 없음 (상대 경로 기준)
import { useLocation } from 'react-router-dom';

// 각 탭에 해당하는 패널 컴포넌트를 정확한 상대 경로로 임포트합니다.
// src/pages/customer/CustomerServiceCenter.jsx 에서
// src/components/CustomerCenterComp/ 로 이동해야 하므로, '../components/CustomerCenterComp/' 경로를 사용합니다.
import NoticePanel from '../../components/CustomerCenterComp/NoticePanel';
import FaqPanel from '../../components/CustomerCenterComp/FaqPanel';
import ProblemSubmit from '../customer/CustomerProblemSubmit';
import InquiryPanel from '../../components/CustomerCenterComp/InquiryPanel';

const CustomerServiceCenter = () => {
  const location = useLocation();
  
  const tabs = ['공지사항', 'FAQ', '문제 제출', '1:1 문의'];
  const initialTab = location.state?.initialTab || tabs[0];
  
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className={styles.customerServiceCenter}>
      {/* 상단 네비게이션/헤더 영역 */}
      <div className={styles.topNav}>
        <Header/>
      </div>

      {/* 탭 버튼들 */}
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

      {/* 탭 내용이 렌더링될 패널 영역 */}
      <div className={styles.tabPanels}>
        {activeTab === '공지사항' && <NoticePanel />}
        {activeTab === 'FAQ' && <FaqPanel />}
        {activeTab === '문제 제출' && <ProblemSubmit />}
        {activeTab === '1:1 문의' && <InquiryPanel />}
      </div>
    </div>
  );
};

export default CustomerServiceCenter;