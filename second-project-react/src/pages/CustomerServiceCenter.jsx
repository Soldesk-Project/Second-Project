import React, { useState } from 'react';
import Header from '../layout/Header';
import styles from '../css/customer.css';

const CustomerServiceCenter = () => {
  // 탭 메뉴 설정
  const tabs = ['1:1 문의', 'FAQ'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <>
      {/* 상단 헤더 */}
      <div className='top-nav'><Header /></div>

      <div className='container'>
        {/* 페이지 제목 */}
        <h1 className='title'>고객센터</h1>

        {/* 탭 네비게이션 */}
        <div className='tab'>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`${'tab'} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className='content'>
          {activeTab === '1:1 문의' && (
            <div className='inquiryForm'>
              <h2>1:1 문의하기</h2>
              <textarea
                className='textarea'
                placeholder="문의할 내용을 작성해주세요."
              />
              <button className='submitButton'>제출하기</button>
            </div>
          )}

          {activeTab === 'FAQ' && (
            <div className='faqList'>
              <h2>자주 묻는 질문</h2>
              <ul>
                <li>Q1. 질문 예시 1?</li>
                <li>Q2. 질문 예시 2?</li>
                <li>Q3. 질문 예시 3?</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerServiceCenter;
