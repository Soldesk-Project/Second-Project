import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../../css/customer.module.css'; 
import { useSelector } from 'react-redux';
import FaqModal from '../modal/FaqModal';

const PAGE_SIZE = 10; 

const FaqPanel = () => {
  const [faqs, setFaqs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalFaqs, setTotalFaqs] = useState(0);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [faqModal, setFaqModal] = useState(false); 
  const [modalStatus, setModalStatus] = useState(''); 
  const [faqItem, setFaqItem] = useState(null); 
  const [refreshFlag, setRefreshFlag] = useState(false);
  const user = useSelector(state => state.user.user);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get(`/api/customer/faqs?page=${page}&size=${PAGE_SIZE}`);
        
        setFaqs(res.data.items); 
        setTotalFaqs(res.data.totalCount); 
      } catch (error) {
        console.error("FAQ 데이터를 가져오는 데 실패했습니다.", error);
        setFaqs([]);
        setTotalFaqs(0);
      }
    };
    fetchFaqs();
    setOpenFaqId(null);
  }, [page, refreshFlag]);

  const reloadFaqs = () => {
    setRefreshFlag(prev => !prev);
  };

  // Faq 작성 모달
  const handleOpenFaqModal=(item)=>{
  
    if (item && typeof item === "object") {
      setModalStatus('edit');
      setFaqItem(item);
    } else {
      setModalStatus('register');
      setFaqItem(null);
    }
    setFaqModal(true);
  }

  const toggleDetails = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalFaqs / PAGE_SIZE));
  };

  return (
    <>
      {
        user?.auth==='ROLE_ADMIN' &&(
        faqModal && (
          modalStatus === 'edit'?
            <FaqModal
              setFaqModal={setFaqModal}
              reloadFaqs={reloadFaqs}
              modalStatus={modalStatus}
              faqItem={faqItem}
              />:
              <FaqModal
              setFaqModal={setFaqModal}
              reloadFaqs={reloadFaqs}
              modalStatus={modalStatus}
            />
        ))
      }
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
            faqs.map((item, index) => (
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
                    {
                      user?.auth==='ROLE_ADMIN' &&(
                        <div className={styles.faq}>
                          <button onClick={()=>handleOpenFaqModal(item)}>수정</button>
                        </div>
                      )
                    }
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
          {
            user?.auth==='ROLE_ADMIN' &&(
              <div className={styles.faq}>
              <button onClick={()=>handleOpenFaqModal(null)}>FAQ 추가</button>
            </div>)
          }
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
    </>
  );
};

export default FaqPanel;