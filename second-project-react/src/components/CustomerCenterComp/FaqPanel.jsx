// C:\Dev\workspace\workspace_2ndProject\second-project-react\src\components\CustomerCenterComp\FaqPanel.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../../css/customer.module.css'; 

const PAGE_SIZE = 15; 

const FaqPanel = () => {
  const [faqs, setFaqs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalFaqs, setTotalFaqs] = useState(0);
  const [openFaqId, setOpenFaqId] = useState(null); 

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get(`/api/customer/faqs?page=${page}&size=${PAGE_SIZE}`);
        console.log("FAQs data received:", res.data);
        
        setFaqs(res.data.items); 
        setTotalFaqs(res.data.totalCount); 
      } catch (error) {
        console.error("FAQ 데이터를 가져오는 데 실패했습니다.", error);
        setFaqs([]);
        setTotalFaqs(0);
      }
    };
    fetchFaqs();
  }, [page]);

  const toggleDetails = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalFaqs / PAGE_SIZE));
  };

  return (
    <section className={styles.content}>
      {/* 리스트 헤더 */}
      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>질문</li> {/* 테이블 컬럼명 QUESTION에 맞춰 '질문' */}
        <li>유형</li> {/* 테이블 컬럼명 CATEGORY에 맞춰 '유형' */}
        <li>날짜</li>
      </ul>
      {/* FAQ 리스트 */}
      <ul className={styles.listView}>
        {faqs.length > 0 ? (
          faqs.map(item => (
            <li key={item.id} className={styles.listItem}>
              <div 
                className={styles.listItemHeader} 
                onClick={() => toggleDetails(item.id)}
              >
                <span className={styles.listItemNo}>{item.id}</span>
                <span className={styles.listItemTitle}>
                  {item.question} {/* FaqVO의 'question' 필드 사용 */}
                </span>
                <span className={styles.listItemAuthor}>
                  {item.category} {/* FaqVO의 'category' 필드 사용 */}
                </span>
                <span className={styles.listItemDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {openFaqId === item.id && (
                <div className={styles.detailContentArea}>
                  <div className={styles.detailContent}>
                    {item.answer && item.answer.split('\n').map((line, index) => (
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
          <li className={styles.noData}>FAQ가 없습니다.</li>
        )}
      </ul>

      {/* 페이징 */}
      <div className={styles.listFooter}>
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

export default FaqPanel;