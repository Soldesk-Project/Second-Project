import React, { useRef, useState } from 'react';
import Header from '../layout/Header';
import styles from '../css/customer.module.css';
import { useNavigate } from 'react-router-dom';

const CustomerCenterNew = () => {

  const navigate = useNavigate();

  const Backinquiries = () => {
    
  }

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files); // 선택된 파일 목록을 상태로 저장
  };

  const triggerFileInput = () => {
    fileInputRef.current.click(); // 숨겨진 input을 클릭
  };

  return (
    <div className={styles.customerServiceCenter}>
      <div className={styles.topNav}><Header/></div>

      <div className={styles.inqueriesBox}>

        <div className={styles.title}>
          <p>고객 문의</p>
        </div>
        <div className={styles.explanation}>
          <p>문의하신 내용에 대해 유저의 이메일로 안내해드리고 있습니다.</p>
          <p>각 서비스의 카테고리 확인 후 문의를 접수해 주세요.</p>
          <p>보내주신 의견은 서비스 개선을 위해 소중히 활용하고 있습니다.</p>
        </div>
        
        <div className={styles.inqContainer}>
        <div className={styles.inqContainerTwo}>
          <div className={styles.inqInfoBox}>
            <div className={styles.inqInfoBox_1}>
              <h6>게시글 비밀번호</h6>
              <input type="password"></input>
            </div>
            <div className={styles.inqInfoBox_2}>
            <h6>이메일</h6>
            <input
              style={{ width: '350px' }}
              type="email"
              placeholder="문의 결과 안내받을 외부 이메일"
              required
            />
            </div>
          </div>

          <div className={styles.inqTextBox}>
            <div className={styles.inqTitle}>
              <h6>제목 (필수)</h6>
              <input style={{ width: '600px' }} type='text' placeholder='제목을 입력하세요.'/>
            </div>
            <div className={styles.textLimitBox}>
              <h6>문의 내용 (필수)</h6>
              <div className={styles.textLimit}>
                <textarea
                  style={{ width: '600px' }}
                  placeholder="1. 문의 내용을 입력하세요."
                  defaultValue="문의 내용"
                  maxLength={1000}
                  />
                <p>0자 입력 / 최대 1000자</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.textarea_1}>
          <p>파일명은 - , _를 제외한 특수문자는 허용되지 않습니다.</p>
          <p>아래 파일 형식만 첨부할 수 있습니다.</p>
          <input
            type="file"
            multiple
            accept=".jpeg,.jpg,.gif,.bmp,.png"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button className={styles.submitBtn} onClick={triggerFileInput}>
            파일 첨부
          </button>

          {/* 첨부된 파일명 출력 */}
          <ul style={{ marginTop: '10px', color: 'white' }}>
            {selectedFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
          <p>이미지: .jpeg, .jpg, .gif, .bmp, .png</p>

        </div>

        <div className={styles.textarea_2}>
          <p>개인정보 수집 동의(필수)</p>
            <p>수집하는 개인정보 항목: 이메일 주소</p>
            <p>작성해 주시는 개인정보는 문의 접수 및 고객 불만 해결을 위해 3년간 보관됩니다.</p>
            <p>이용자는 본 동의를 거부할 수 있으나, 미동의 시 문의 접수가 불가능합니다.</p>
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

export default CustomerCenterNew;