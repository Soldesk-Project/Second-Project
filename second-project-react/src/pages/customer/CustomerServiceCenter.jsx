import React, { useEffect, useState } from 'react';
import Header from '../../layout/Header';
import styles from '../../css/customer.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE_SIZE = 15;

const CustomerServiceCenter = () => {
  const location = useLocation();
  
  const tabs = ['공지사항', 'FAQ', '문제 제출', '1:1 문의'];
  const initialTab = location.state?.initialTab || tabs[0];
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);

  // 각각 탭용 데이터 상태
  const [notices, setNotices] = useState([]);
  const [faqList, setFaqList] = useState([]);
  const [problems, setProblems] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  // 전체 개수 상태
  const [totalNotices, setTotalNotices] = useState(0);
  const [totalFaq, setTotalFaq] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [totalInquiries, setTotalInquiries] = useState(0);


  const navigate = useNavigate();

  const pathMap = {
    '문제 제출': '/problemsubmit',
    '1:1 문의': '/inquiry'
  };
  const newPath = pathMap[activeTab];

  // 탭이 바뀌거나 페이지가 바뀔 때 데이터 fetch
  useEffect(() => {
    const fetchNotices = async () => {
      const res = await axios.get(
        `/api/customer/notices?page=${page}&size=${PAGE_SIZE}`);
      setNotices(res.data.items);
      setTotalNotices(res.data.totalCount);
    };
    const fetchFaq = async () => {
      const res = await axios.get(
        `/api/customer/faqs?page=${page}&size=${PAGE_SIZE}`);
      setFaqList(res.data.items);
      setTotalFaq(res.data.totalCount);
    };
    const fetchProblems = async () => {
      const res = await axios.get(
        `/api/customer/problems?page=${page}&size=${PAGE_SIZE}`);
      setProblems(res.data.items);
      setTotalProblems(res.data.totalCount);
    };
    const fetchInquiries = async () => {
      const res = await axios.get(
        `/api/customer/inquiries?page=${page}&size=${PAGE_SIZE}`);
      setInquiries(res.data.items);
      setTotalInquiries(res.data.totalCount);
    };

    switch (activeTab) {
      case '공지사항':
        fetchNotices();
        break;
      case 'FAQ':
        fetchFaq();
        break;
      case '문제 제출':
        fetchProblems();
        break;
      case '1:1 문의':
        fetchInquiries();
        break;
      default:
        break;
    }
  }, [activeTab, page]);

  // 현재 탭의 총 페이지 수 계산
  const getTotalPages = () => {
    const total = {
      '공지사항': totalNotices,
      'FAQ': totalFaq,
      '문제 제출': totalProblems,
      '1:1 문의': totalInquiries,
    }[activeTab] || 0;
    return Math.ceil(total / PAGE_SIZE);
  };

  return (
    <div className={styles.customerServiceCenter}>
      <div className={styles.topNav}><Header/></div>
      <div className={styles.title}><p>Support</p></div>

      {/* 탭 */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${tab === activeTab ? styles.active : ''}`}
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
      <div className={styles.tabPanels}>
        {/* 공지사항 */}
        {activeTab === '공지사항' && (
          <section className={styles.content}>
            {/* 리스트 헤더 */}
            <ul className={styles.inquiryTitle}>
              <li>번호</li><li>제목</li><li>작성자</li><li>날짜</li>
            </ul>
            {/* 데이터 */}
            <ul className={styles.inquiryList}>
              {notices.map(item => (
                <li key={item.id} className={styles.inquiryPersonal}>
                  <span className={styles.inquiryNo}>{item.id}</span>
                  <button
                    className={styles.inquiryLink}
                    onClick={() => navigate(`/notices/${item.id}`)}
                  >
                    {item.subject}
                  </button>
                  <span className={styles.inquiryNick}>{item.userNick}</span>
                  <span className={styles.inquiryDate}>
                    — {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        {activeTab === 'FAQ' && (
          <section className={styles.content}>
            <ul className={styles.inquiryTitle}>
              <li>번호</li><li>제목</li><li>날짜</li>
            </ul>
            <ul className={styles.inquiryList}>
              {faqList.map(item => (
                <li key={item.id} className={styles.inquiryPersonal}>
                  <button
                    className={styles.inquiryLink}
                    onClick={() => navigate(`/faqs/${item.id}`)}
                  >
                    {item.subject}
                  </button>
                  <span className={styles.inquiryDate}>
                    — {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 문제 제출 */}
        {activeTab === '문제 제출' && (
          <section className={styles.content}>
            <ul className={styles.inquiryTitle}>
              <li>번호</li><li>제목</li><li>작성자</li><li>날짜</li>
            </ul>
            <ul className={styles.inquiryList}>
              {problems.map(item => (
                <li key={item.id} className={styles.inquiryPersonal}>
                  <button
                    className={styles.inquiryLink}
                    onClick={() => navigate(`/problems/${item.id}`)}
                  >
                    {item.subject}
                  </button>
                  <span className={styles.inquiryNick}>{item.userNick}</span>
                  <span className={styles.inquiryDate}>
                    — {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 1:1 문의 */}
        {activeTab === '1:1 문의' && (
          <section className={styles.content}>
            <ul className={styles.inquiryTitle}>
              <li>번호</li><li>제목</li><li>닉네임</li><li>날짜</li>
            </ul>
            <ul className={styles.inquiryList}>
              {inquiries.map(inq => (
                <li key={inq.id} className={styles.inquiryPersonal}>
                  <span className={styles.inquiryNo}>{inq.id}</span>
                  <button
                    className={styles.inquiryLink}
                    onClick={() => navigate(`/inquiries/${inq.id}`)}
                  >
                    {inq.subject}
                  </button>
                  <span className={styles.inquiryNick}>{inq.userNick}</span>
                  <span className={styles.inquiryDate}>
                    — {new Date(inq.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* 공통: 페이징 및 새 글 버튼 */}
      <div className={styles.listBottom}>

        {newPath && (
         <button
           className={styles.InqBtn}
           onClick={() => navigate(newPath)}
         >
           새 글 등록
         </button>
       )}

        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </button>
          <span>{page} / {getTotalPages()}</span>
          <button
            onClick={() => setPage(p => Math.min(getTotalPages(), p + 1))}
            disabled={page === getTotalPages()}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceCenter;
