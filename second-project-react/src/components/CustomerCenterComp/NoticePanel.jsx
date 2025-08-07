import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import styles from '../../css/customer.module.css'; 
import NoticeModal from '../modal/NoticeModal';
import { useSelector } from 'react-redux';

const PAGE_SIZE = 10; 

const NoticePanel = () => {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalNotices, setTotalNotices] = useState(0);
  const [openNoticeId, setOpenNoticeId] = useState(null); 
  const [noticeModal, setNoticeModal] = useState(false); 
  const [modalStatus, setModalStatus] = useState(''); 
  const [noticeItem, setNoticeItem] = useState(null); 
  const [refreshFlag, setRefreshFlag] = useState(false);
  const user = useSelector(state => state.user.user);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await axios.get(`/api/customer/notices?page=${page}&size=${PAGE_SIZE}`);
        setNotices(res.data.items);
        setTotalNotices(res.data.totalCount);
      } catch (error) {
        setNotices([]);
        setTotalNotices(0);
      }
    };
    fetchNotices();
    setOpenNoticeId(null);
  }, [page, refreshFlag]);

  const reloadNotices = () => {
    setRefreshFlag(prev => !prev);
  };

  // 공지사항 작성 모달
  const handleOpenNoticeModal=(item)=>{
    if (item && typeof item === "object") {
      setModalStatus('edit');
      setNoticeItem(item);
    } else {
      setModalStatus('register');
      setNoticeItem(null);
    }
    setNoticeModal(true);

  }

  const toggleDetails = (id) => {
    setOpenNoticeId(openNoticeId === id ? null : id);
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalNotices / PAGE_SIZE));
  };

  return (
    <>
      {
        user?.auth==='ROLE_ADMIN' &&(
        noticeModal && (
          modalStatus === 'edit'?
            <NoticeModal
              setNoticeModal={setNoticeModal}
              reloadNotices={reloadNotices}
              modalStatus={modalStatus}
              noticeItem={noticeItem}
              />:
              <NoticeModal
              setNoticeModal={setNoticeModal}
              reloadNotices={reloadNotices}
              modalStatus={modalStatus}
            />
        ))
      }
      <section className={styles.content}>
        <ul className={styles.listHeader}>
          <li>번호</li>
          <li>제목</li>
          <li>작성자</li> 
          <li>날짜</li>
        </ul>
        <ul className={styles.listView}>
          {notices.length > 0 ? (
            notices.map((item, index) => (
              <li key={item.id} className={styles.listItem}>
                <div 
                  className={styles.listItemHeader} 
                  onClick={() => toggleDetails(item.id)}>
                  <span className={styles.listItemNo}>{item.id}</span>
                  <span className={styles.listItemTitle}>
                    {item.subject}
                  </span>
                  <span className={styles.listItemAuthor}>관리자</span> 
                  <span className={styles.listItemDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {openNoticeId === item.id && (
                  <div className={styles.detailContentArea}>
                    <div className={styles.detailContent}>
                      {item.message && item.message.split('\n').map((line, index) => (
                        <React.Fragment key={index}> 
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </div>
                    {
                      user?.auth==='ROLE_ADMIN' &&(
                        <div className={styles.notice}>
                          <button onClick={()=>handleOpenNoticeModal(item)}>수정</button>
                        </div>
                      )
                    }
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className={styles.noData}>공지사항이 없습니다.</li>
          )}
        </ul>
        <div className={styles.listFooter}>
          {
            user?.auth==='ROLE_ADMIN' &&(
            <div className={styles.notice}>
              <button onClick={()=>handleOpenNoticeModal(null)}>공지사항 추가</button>
            </div>)
          }
          <div className={styles.pagination}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}>
              이전
            </button>
            <span>{page} / {getTotalPages()}</span>
            <button
              onClick={() => setPage(p => Math.min(getTotalPages(), p + 1))}
              disabled={page === getTotalPages()}>
              다음
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default NoticePanel;