import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../../css/customer.module.css'; 

const PAGE_SIZE = 10; 

const InquiryPanel = () => {
  const [inquiries, setInquiries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [openInquiryId, setOpenInquiryId] = useState(null); 
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await axios.get(`/api/customer/inquiries?page=${page}&size=${PAGE_SIZE}`);
        console.log("Inquiries data received:", res.data);
        setInquiries(res.data.items);
        setTotalInquiries(res.data.totalCount);
      } catch (error) {
        console.error("1:1 문의 데이터를 가져오는 데 실패했습니다.", error);
        setInquiries([]);
        setTotalInquiries(0);
      }
    };
    fetchInquiries();
  }, [page]);

  const toggleDetails = (id) => {
    setOpenInquiryId(openInquiryId === id ? null : id);
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalInquiries / PAGE_SIZE));
  };

  return (
    <section className={styles.content}>
      {/* 리스트 헤더 */}
      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>제목</li>
        <li>닉네임</li>
        <li>날짜</li>
      </ul>
      {/* 1:1 문의 리스트 */}
      <ul className={styles.listView}>
        {inquiries.length > 0 ? (
          inquiries.map(item => (
            <li key={item.id} className={styles.listItem}>
              <div 
                className={styles.listItemHeader} 
                onClick={() => toggleDetails(item.id)}
              >
                <span className={styles.listItemNo}>{item.id}</span>
                <span className={styles.listItemTitle}>
                  {item.subject}
                </span>
                <span className={styles.listItemAuthor}>{item.userNick}</span> {/* userNick -> listItemAuthor */}
                <span className={styles.listItemDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {openInquiryId === item.id && (
                <div className={styles.detailContentArea}>
                  <div className={styles.detailContent}>
                    {item.message && item.message.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))
        ) : (
          <li className={styles.noData}>1:1 문의 내역이 없습니다.</li>
        )}
      </ul>

      {/* 새 글 등록 버튼 및 페이징 */}
      <div className={styles.listFooter}>
        <button
          className={styles.primaryButton}
          onClick={() => navigate('/inquiry')}
        >
          새 글 등록
        </button>

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
    </section>
  );
};

export default InquiryPanel;