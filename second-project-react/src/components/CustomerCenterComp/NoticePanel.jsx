import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import styles from '../../css/customer.module.css'; 

const PAGE_SIZE = 5; 

const NoticePanel = () => {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalNotices, setTotalNotices] = useState(0);
  const [openNoticeId, setOpenNoticeId] = useState(null); 

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await axios.get(`/api/customer/notices?page=${page}&size=${PAGE_SIZE}`);
        console.log("Notices data received:", res.data);
        setNotices(res.data.items);
        setTotalNotices(res.data.totalCount);
      } catch (error) {
        console.error("공지사항 데이터를 가져오는 데 실패했습니다.", error);
        setNotices([]);
        setTotalNotices(0);
      }
    };
    fetchNotices();
  }, [page]);

  const toggleDetails = (id) => {
    setOpenNoticeId(openNoticeId === id ? null : id);
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalNotices / PAGE_SIZE));
  };

  return (
    // section 시작
    <section className={styles.content}>
      {/* ul.listHeader 시작 */}
      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>제목</li>
        <li>작성자</li> 
        <li>날짜</li>
      </ul>
      {/* ul.listHeader 끝 */}

      {/* ul.listView 시작 */}
      <ul className={styles.listView}>
        {notices.length > 0 ? (
          notices.map(item => (
            // li.listItem 시작
            <li key={item.id} className={styles.listItem}>
              {/* div.listItemHeader 시작 */}
              <div 
                className={styles.listItemHeader} 
                onClick={() => toggleDetails(item.id)}
              >
                <span className={styles.listItemNo}>{item.id}</span>
                <span className={styles.listItemTitle}>
                  {item.subject}
                </span>
                <span className={styles.listItemAuthor}>관리자</span> 
                <span className={styles.listItemDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              {/* div.listItemHeader 끝 */}
              
              {openNoticeId === item.id && (
                // div.detailContentArea 시작
                <div className={styles.detailContentArea}>
                  {/* div.detailContent 시작 */}
                  <div className={styles.detailContent}>
                    {item.message && item.message.split('\n').map((line, index) => (
                      // React.Fragment 시작
                      <React.Fragment key={index}> 
                        {line}
                        <br />
                      </React.Fragment>
                      // React.Fragment 끝
                    ))}
                  </div>
                  {/* div.detailContent 끝 */}
                </div>
                // div.detailContentArea 끝
              )}
            </li>
            // li.listItem 끝
          ))
        ) : (
          // li.noData 시작
          <li className={styles.noData}>공지사항이 없습니다.</li>
          // li.noData 끝
        )}
      </ul>
      {/* ul.listView 끝 */}

      {/* div.listFooter 시작 */}
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
      {/* div.listFooter 끝 */}
    </section>
    // section 끝
  );
};

export default NoticePanel;