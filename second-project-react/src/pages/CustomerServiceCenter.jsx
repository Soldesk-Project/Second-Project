import React, { useState } from 'react';
import Header from '../layout/Header';
import '../css/customer.css';

const tabs = ['1:1 문의', '문제 제출', '고객 건의', 'Q&A'];

const CustomerServiceCenter = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <>
      <div className="top-nav">
        <Header />
      </div>

      {/* 탭 리스트 */}
      <div role="tablist" className="tab-list">
        {tabs.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 패널 */}
      <div className="tab-panels">
        {activeTab === '1:1 문의' && (
          <section role="tabpanel" className="content">
            <h2>1:1 문의하기</h2>
            <textarea
              className="textarea"
              placeholder="문의할 내용을 작성해주세요."
            />
            <button className="submitButton">제출하기</button>
          </section>
        )}

        {activeTab === '문제 제출' && (
          <section role="tabpanel" className="content">
            <h2>문제 제출하기</h2>
            {/* problem submission form */}
          </section>
        )}

        {activeTab === '고객 건의' && (
          <section role="tabpanel" className="content">
            <h2>고객 건의하기</h2>
            {/* suggestion form */}
          </section>
        )}

        {activeTab === 'Q&A' && (
          <section role="tabpanel" className="content">
            <h2>자주 묻는 질문 (Q&amp;A)</h2>
            <ul className="faqList">
              <li>Q1. 질문 예시 1?</li>
              <li>Q2. 질문 예시 2?</li>
              <li>Q3. 질문 예시 3?</li>
            </ul>
          </section>
        )}
      </div>
    </>
  );
};

export default CustomerServiceCenter;
