import React from 'react';
import Header from '../layout/Header';
import styles from '../css/customer.module.css';
import { useNavigate } from 'react-router-dom';

const CustomerProblemSubmit = () => {
  
  const navigate = useNavigate();
  
  const Backinquiries = () => {
      
  }
  
  return (
    <div className={styles.customerServiceCenter}>
      <div className={styles.topNav}><Header/></div>

      <div className={styles.inqueriesBox}>

        <div className={styles.title}>
          <p>문제 제출</p>
        </div>
        <div>
          <p>간단한 설명</p>
        </div>
        
        <div className={styles.inqContainer}>
        <div className={styles.inqContainerTwo}>
          <div className={styles.inqPwBox}>
            <p>아이디(db에서 불러오기)</p>
            <p>게시글 비밀번호</p>
            <input></input>
          </div>
          <div className={styles.email}>
            <input
              type="email"
              placeholder="문의 결과 안내받을 외부 이메일"
              required
            />
          </div>

          <div className={styles.inqTextBox}>
            <div className={styles.inqTitle}>
              <p>제목</p>
              <input type='text' placeholder='제목을 입력하세요.'/>
            </div>
            <textarea
              placeholder="1. 제출하실 문제를 등록해주세요."
              defaultValue="제출 문제 내용"
              maxLength={1000}
            />
          </div>
        </div>
          <div className={styles.textLimit}>
            <p>0자 입력 / 최대 10000자</p>
          </div>

        <div>
          <p>사진첨부 (선택)</p>
          <p>업로드</p>
          <p>업로드 관련 제한사항 등 설명, 가능 불가능 확장자 설명</p>
        </div>

        <div>
          <p>개인정보 수집 동의 (필수)</p>
          <p>수집하는 개인정보 항목 : 이메일 주소</p>
          <p>동의 관련 문구 안내</p>
          <p>체크박스</p>
          <p>동의합니다.</p>
        </div>
        
        <div className={styles.inqBtns}>
          <button className={styles.submitBtn}>등록</button>
          <button className={styles.submitBtn} onClick={() => navigate('/inquiries')}>돌아가기</button>
        </div>
        </div>
        
      </div>
    </div>
  );
};

export default CustomerProblemSubmit;