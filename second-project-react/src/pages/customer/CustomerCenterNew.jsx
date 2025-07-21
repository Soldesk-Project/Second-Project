import React, { useRef, useState } from 'react';
import Header from '../../layout/Header';
import styles from '../../css/customer.module.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CustomerCenterNew = () => {
  const navigate = useNavigate();

  // 1) state 정의
  const [postPassword, setPostPassword] = useState('');
  const [email, setEmail]             = useState('');
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [consent, setConsent]         = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };
  const triggerFileInput = () => fileInputRef.current.click();

  const user = useSelector(state => state.user); 
  // store 구조에 따라 state.auth.user 또는 state.user 로 바꿔주세요
  const id = user?.id;

  const userNick = user?.nick || user?.userNick || '';

  // 2) 폼 제출 핸들러
  const handleSubmit = async (e) => {
    // if (!userId) {
    //   alert('로그인이 필요합니다.');
    //   return navigate('/');
    // }

    e.preventDefault();
    if (!consent) {
      return alert('개인정보 수집 동의가 필요합니다.');
    }

    const formData = new FormData();
    // 백엔드 @RequestParam 이름과 맞춰서 append
    formData.append('userNick', userNick); 
    formData.append('postPassword', postPassword);
    formData.append('email', email);
    formData.append('subject', title);
    formData.append('message', content);

    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await axios.post(
        'http://localhost:9099/api/customer/inquiry',
        formData
        // axios는 FormData를 감지하면 자동으로 올바른 Content-Type(boudary 포함)을 설정합니다.
 );
      alert('문의가 정상적으로 등록되었습니다.');
      navigate('/inquiries');
    } catch (err) {
      console.error(err);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.customerServiceCenter}>
      <div className={styles.topNav}><Header/></div>

      <div className={styles.inqueriesBox}>
        <form onSubmit={handleSubmit}>
        <div className={styles.title}>
          <h1 style={{ color: 'white' }}>고객 문의</h1>
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
              <input
              type="password"
              value={postPassword}
              onChange={e => setPostPassword(e.target.value)}
              required
            />
            </div>
            <div className={styles.inqInfoBox_2}>
            <h6>이메일</h6>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="문의 결과 안내받을 이메일"
              required
              style={{ width: '350px' }}
            />
            </div>
          </div>

          <div className={styles.inqTextBox}>
            <div className={styles.inqTitle}>
              <h6>제목 (필수)</h6>
              <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              required
              style={{ width: '600px' }}
            />
            </div>
            <div className={styles.textLimitBox}>
              <h6>문의 내용 (필수)</h6>
              <div className={styles.textLimit}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="문의 내용을 입력하세요."
                  maxLength={1000}
                  required
                  style={{ width: '600px', height: '250px' }}
                />
                <p>{content.length}자 입력 / 최대 1000자</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.textareaBox}>
          <h6>첨부 파일 (선택)</h6>
        <div className={styles.textareaBox_1}>
          <h6>첨부 파일</h6>
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

            <button 
              type="button" 
              className={styles.submitBtn} 
              onClick={triggerFileInput}
            >
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
        </div>

        <div className={styles.textareaBox_2}>
          <h6>개인정보 수집 동의(필수)</h6>
          <div className={styles.textarea_2}>
            <p>수집하는 개인정보 항목: 이메일 주소</p>
            <p>작성해 주시는 개인정보는 문의 접수 및 고객 불만 해결을 위해 3년간 보관됩니다.</p>
            <p>이용자는 본 동의를 거부할 수 있으나, 미동의 시 문의 접수가 불가능합니다.</p>
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
            />&nbsp;<span>동의합니다.</span>
          </div>
        </div>
        </div>
        
        {/* 버튼 */}
          <div className={styles.inqBtns}>
            <button 
              type="submit" 
              className={styles.submitBtn}
            >
              등록
            </button>
            <button 
              type="button" 
              className={styles.submitBtn} 
              onClick={() => navigate('/inquiries' , {
              state: { initialTab: '1:1 문의' }
            })}>
              돌아가기
            </button>
            </div>
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default CustomerCenterNew;