import React, { useEffect, useState } from 'react';
import Header from '../layout/Header';
import '../css/customer.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE_SIZE = 15;

const CustomerServiceCenter = () => {
  const tabs = ['1:1 문의', 'FAQ', '문제 제출', '고객 건의'];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [inquiries, setInquiries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  // 문의 목록 가져오기
  useEffect(() => {
    if (activeTab !== '1:1 문의') return;
    const fetchData = async () => {
      try{
        const res = await axios.get(
          `/api/customer/inquiries?page=${page}&size=${PAGE_SIZE}`
        );
        setInquiries(res.data.items);
        setTotalCount(res.data.totalCount);
      } catch (error){
        console.error('문의 목록 조희 실패:',{
          status : error.response?.status,
          body: error.response?.data,
        });
      }
    };
    fetchData();
  }, [activeTab, page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="customer-service-center">
      <div className='top-nav'><Header/></div>

      <div className='title'>
        <p>Support</p>
      </div>
      {/* 탭 */}

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={tab === activeTab ? 'active' : ''}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 패널 */}
      <div className="tab-panels">
        {activeTab === '1:1 문의' && (
          <section role="tabpanel" className="content">

          <div className='inquiry-box'>
            <ul className="inquiry-title">
              <li>Title</li>
              <li>NickName</li>
              <li>Data</li>
            </ul>
              {/* 문의글 리스트 (간단하게 제목만 표시) */}
              <ul className="inquiry-list">
                {inquiries.map(inq => (
                  <li key={inq.id} className='inquiry-personal'>
                    <strong>{inq.subject}</strong> — {inq.createdAt}
                  </li>
                ))}
              </ul>

            {/* 페이징 */}
            <div className='list-bottom'>
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  >
                  이전
                </button>
                <span>{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  >
                  다음
                </button>
              </div>

              {/* 새 문의글 등록 버튼 */}
              <button
                className="InqBtn"
                onClick={() => navigate('/inquiry')}
                >
                새 문의글 등록
              </button>
            </div>
          </div>
          </section>
        )}

        {activeTab === 'FAQ' && (
          <section role="tabpanel" className="content">
            
            <div className='inquiry-box'>
              <ul className="inquiry-title">
                <li>Title</li>
                <li>Data</li>
              </ul>
                {/* FAQ 리스트 */}
                <ul className="inquiry-list">
                  {inquiries.map(inq => (
                    <li key={inq.id} className='inquiry-personal'>
                      <strong>{inq.subject}</strong> — {inq.createdAt}
                    </li>
                  ))}
                </ul>

              {/* 페이징 */}
              <div className='list-bottom'>
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    >
                    이전
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    >
                    다음
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === '문제 제출' && (
          <section role="tabpanel" className="content">
            <div className='inquiry-box'>
              <ul className="inquiry-title">
                {/* 파일 업로드, 설명 입력 폼 등 구현 */}
                <li>Title</li>
                <li>Data</li>
              </ul>
                {/* FAQ 리스트 */}
                <ul className="inquiry-list">
                  {inquiries.map(inq => (
                    <li key={inq.id} className='inquiry-personal'>
                      <strong>{inq.subject}</strong> — {inq.createdAt}
                    </li>
                  ))}
                </ul>

              {/* 페이징 */}
              <div className='list-bottom'>
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    >
                    이전
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    >
                    다음
                  </button>
                </div>

                {/* 새 건의글 등록 버튼 */}
                <button
                  className="InqBtn"
                  onClick={() => navigate('/inquiry')}
                  >
                  건의글 등록
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === '고객 건의' && (
          <section role="tabpanel" className="content">
            <div className='inquiry-box'>
              <ul className="inquiry-title">
                <li>Title</li>
                <li>NickName</li>
                <li>Data</li>
              </ul>
                {/* 건의글 리스트 */}
                <ul className="inquiry-list">
                  {inquiries.map(inq => (
                    <li key={inq.id} className='inquiry-personal'>
                      <strong>{inq.subject}</strong> — {inq.createdAt}
                    </li>
                  ))}
                </ul>

              {/* 페이징 */}
              <div className='list-bottom'>
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    >
                    이전
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    >
                    다음
                  </button>
                </div>

                {/* 새 건의글 등록 버튼 */}
                <button
                  className="InqBtn"
                  onClick={() => navigate('/inquiry')}
                  >
                  건의글 등록
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CustomerServiceCenter;
