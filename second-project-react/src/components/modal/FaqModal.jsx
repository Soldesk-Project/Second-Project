import React, { useEffect, useState } from 'react';
import styles from '../../css/FaqModal.module.css';
import axios from 'axios';

const FaqModal = ({setFaqModal, reloadFaqs, modalStatus, faqItem}) => {
  const [faqTitle, setFaqTitle] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [faqCategory, setFaqCategory] = useState('');
  const token = localStorage.getItem('token');

  const getToday = () => {
    const today = new Date();
    return `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;
  };

  useEffect(() => {
    if (modalStatus === 'edit' && faqItem) {
      setFaqTitle(faqItem.question || '');
      setFaqContent(faqItem.answer || '');
      setFaqCategory(faqItem.category || '');
    } else if (modalStatus === 'register') {
      setFaqTitle('');
      setFaqContent('');
      setFaqCategory('');
    }
  }, [modalStatus, faqItem]);

  const closeModal=()=>{
    setFaqModal(false);
  }

  // FAQ 등록
  const registerFaq=async()=>{
    if (faqTitle.length===0 || faqTitle.length > 40) {
      alert('제목은 1~40글자로 입력해주세요.');
      return;
    }
    if (faqContent.length===0) {
      alert('내용을 입력해주세요.');
      return;
    }
    if (faqCategory.length===0 || faqCategory.length>6) {
      alert('카테고리는 1~5글자로 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post('/admin/registerFaq',{question: faqTitle, answer: faqContent, category: faqCategory},{
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert(res.data);
      closeModal();
      reloadFaqs();
    } catch (error) {
      console.log(error);
      
      alert('FAQ 등록 에러 발생');      
    }
  }
  
  // FAQ 수정
  const editFaq=async()=>{
    if (faqTitle.length===0 || faqTitle.length > 40) {
      alert('제목은 1~40글자로 입력해주세요.');
      return;
    }
    if (faqContent.length===0) {
      alert('내용을 입력해주세요.');
      return;
    }
    if (faqCategory.length===0 || faqCategory.length>6) {
      alert('카테고리는 1~5글자로 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post('/admin/editFaq',{id: faqItem.id, question: faqTitle, answer: faqContent, category: faqCategory},{
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      alert(res.data);
      closeModal();
      reloadFaqs();
    } catch (error) {
      alert('FAQ 수정 중 에러 발생');
    }
  }
  
  // FAQ 삭제
  const deleteFaq=async()=>{
    // eslint-disable-next-line no-restricted-globals
    if (confirm('FAQ를 삭제하시겠습니까?')) {
      try {
        const res = await axios.post('/admin/deleteFaq', {id: faqItem.id},{
          headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        alert(res.data);
        closeModal();
        reloadFaqs();
      } catch (error) {
        alert('FAQ 삭제 중 에러 발생');        
      }
    }
  }


  return (
    <div className={styles.container}>
          <div className={styles.content}>
            {
              modalStatus ==='edit' && (
                <>
                  <h3>FAQ 수정</h3>
                  <table>
                    <tbody>
                      <tr>
                        <td className={styles.faqCategory}>제목</td>
                        <td className={styles.faqContent}><input type="text" value={faqTitle} onChange={(e)=>setFaqTitle(e.target.value)}/></td>
                      </tr>
                      <tr>
                        <td className={styles.faqCategory}>작성일자</td>
                        <td className={styles.faqContent}><span>{getToday()}</span></td>
                      </tr>
                      <tr>
                        <td className={styles.faqCategory}>카테고리</td>
                        <td className={styles.faqContent}><input type="text" value={faqCategory} onChange={(e)=>setFaqCategory(e.target.value)}/></td>
                      </tr>
                      <tr>
                        <td className={styles.faqCategory}>내용</td>
                        <td className={styles.faqContent}><textarea value={faqContent} onChange={(e)=>setFaqContent(e.target.value)}/></td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )
            }
            {
              modalStatus ==='register' && (
                <>
                  <h3>FAQ 등록</h3>
                  <table>
                    <tbody>
                      <tr>
                        <td className={styles.faqCategory}>제목</td>
                        <td className={styles.faqContent}><input type="text" value={faqTitle} onChange={(e)=>setFaqTitle(e.target.value)}/></td>
                      </tr>
                      <tr>
                        <td className={styles.faqCategory}>작성일자</td>
                        <td className={styles.faqContent}><span>{getToday()}</span></td>
                      </tr>
                      <tr>
                        <td className={styles.faqCategory}>카테고리</td>  
                        <td className={styles.faqContent}><input type="text" value={faqCategory} onChange={(e)=>setFaqCategory(e.target.value)}/></td>
                      </tr>
                      <tr>
                        <td className={styles.faqCategory}>내용</td>
                        <td className={styles.faqContent}><textarea value={faqContent} onChange={(e)=>setFaqContent(e.target.value)}/></td>
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
                  <button className={styles.delete} onClick={deleteFaq}>삭제하기</button>
                  <button className={styles.edit} onClick={editFaq}>수정하기</button>
                </>
              )
            }
            {
              modalStatus ==='register' && (
                <>
                  <button className={styles.close} onClick={closeModal}>취소</button>
                  <button className={styles.register} onClick={registerFaq}>등록하기</button>
                </>
              )
            }
          </div>
        </div>
  );
};

export default FaqModal;