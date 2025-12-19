import React, { useEffect, useState } from 'react';
import styles from '../../css/modal/NoticeModal.module.css';
import axios from 'axios';

const NoticeModal = ({setNoticeModal, reloadNotices, modalStatus, noticeItem}) => {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const token = localStorage.getItem('token');
  
  const getToday = () => {
    const today = new Date();
    return `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;
  };

  useEffect(() => {
    if (modalStatus === 'edit' && noticeItem) {
      setNoticeTitle(noticeItem.subject || '');
      setNoticeContent(noticeItem.message || '');
    } else if (modalStatus === 'register') {
      setNoticeTitle('');
      setNoticeContent('');
    }
  }, [modalStatus, noticeItem]);

  const closeModal=()=>{
    setNoticeModal(false);
  }

  // 공지사항 등록
  const registerNotice=async()=>{
    if (noticeTitle.length===0 || noticeTitle.length > 40) {
      alert('제목은 1~40글자로 입력해주세요.');
      return;
    }
    if (noticeContent.length===0) {
      alert('내용을 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post('api/admin/registerNotice',{subject: noticeTitle, message: noticeContent},{
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert(res.data);
      closeModal();
      reloadNotices();
    } catch (error) {
      alert('공지사항 등록 에러 발생');      
    }
  }
  
  // 공지사항 수정
  const editNotice=async()=>{
    if (noticeTitle.length===0 || noticeTitle.length > 40) {
      alert('제목은 1~40글자로 입력해주세요.');
      return;
    }
    if (noticeContent.length===0) {
      alert('내용을 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post('api/admin/editNotice',{id: noticeItem.id, subject: noticeTitle, message: noticeContent},{
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      alert(res.data);
      closeModal();
      reloadNotices();
    } catch (error) {
      alert('공지사항 수정 중 에러 발생');
    }
  }
  
  // 공지사항 삭제
  const deleteNotice=async()=>{
    // eslint-disable-next-line no-restricted-globals
    if (confirm('공지사항을 삭제하시겠습니까?')) {
      try {
        const res = await axios.post('api/admin/deleteNotice', {id: noticeItem.id},{
          headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        alert(res.data);
        closeModal();
        reloadNotices();
      } catch (error) {
        alert('공지사항 삭제 중 에러 발생');        
      }
    }
  }



  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {
          modalStatus ==='edit' && (
            <>
              <h3>공지사항 수정</h3>
              <table>
                <tbody>
                  <tr>
                    <td className={styles.noticeCategory}>제목</td>
                    <td className={styles.noticeContent}><input type="text" value={noticeTitle} onChange={(e)=>setNoticeTitle(e.target.value)}/></td>
                  </tr>
                  <tr>
                    <td className={styles.noticeCategory}>작성일자</td>
                    <td className={styles.noticeContent}><span>{getToday()}</span></td>
                  </tr>
                  <tr>
                    <td className={styles.noticeCategory}>내용</td>
                    <td className={styles.noticeContent}><textarea value={noticeContent} onChange={(e)=>setNoticeContent(e.target.value)}/></td>
                  </tr>
                </tbody>
              </table>
            </>
          )
        }
        {
          modalStatus ==='register' && (
            <>
              <h3>공지사항 등록</h3>
              <table>
                <tbody>
                  <tr>
                    <td className={styles.noticeCategory}>제목</td>
                    <td className={styles.noticeContent}><input type="text" value={noticeTitle} onChange={(e)=>setNoticeTitle(e.target.value)}/></td>
                  </tr>
                  <tr>
                    <td className={styles.noticeCategory}>작성일자</td>
                    <td className={styles.noticeContent}><span>{getToday()}</span></td>
                  </tr>
                  <tr>
                    <td className={styles.noticeCategory}>내용</td>
                    <td className={styles.noticeContent}><textarea value={noticeContent} onChange={(e)=>setNoticeContent(e.target.value)}/></td>
                  </tr>
                </tbody>
              </table>
            </>
          )
        }
      </div>
      <div className={styles.butttnWrapper}>
        {
          modalStatus === 'edit' &&(
            <>
              <button className={styles.close} onClick={closeModal}>취소</button>
              <button className={styles.delete} onClick={deleteNotice}>삭제하기</button>
              <button className={styles.edit} onClick={editNotice}>수정하기</button>
            </>
          )
        }
        {
          modalStatus ==='register' && (
            <>
              <button className={styles.close} onClick={closeModal}>취소</button>
              <button className={styles.register} onClick={registerNotice}>등록하기</button>
            </>
          )
        }
      </div>
    </div>
  );
};

export default NoticeModal;