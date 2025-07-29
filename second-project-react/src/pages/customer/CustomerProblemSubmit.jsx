import React, { useRef, useState } from 'react';
import styles from '../../css/customer.module.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CustomerProblemSubmit = () => {
  
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
  const userId = user?.id;

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
    formData.append('userId', userId); 
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

      <div className={styles.inqueriesBox}>
        <form onSubmit={handleSubmit}>
        <div className={styles.title}>
          <h1 style={{ color: 'white' }}>문제 접수</h1>
        </div>
        <div className={styles.explanation}>
          <p>접수하신 문제가 등록되었는지의 유무는 유저의 이메일로 안내해드리고 있습니다.</p>
          <p>보내주신 문제는 서비스 개선을 위해 소중히 활용하고 있습니다.</p>
        </div>
        
        <div className={styles.inqContainer}>
        <div className={styles.inqContainerTwo}>
          <div className={styles.inqInfoBox}>
            <div className={styles.inqInfoBox_1}>
              <h3 className={styles.h3}>1. 게시글 비밀번호</h3>
              <input
              className={styles.input}
              type="password"
              value={postPassword}
              onChange={e => setPostPassword(e.target.value)}
              placeholder="게시글 비밀번호를 입력하세요"
              required
            />
            </div>
            <div className={styles.inqInfoBox_2}>
            <h3 className={styles.h3}>2. 이메일</h3>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="문의 결과 안내받을 이메일을 입력하세요"
              required
            />
            </div>
          </div>

          <div className={styles.inqTextBox}>
            <div className={styles.inqTitle}>
              <h5 className={styles.h3}>3. 제목 (필수)</h5>
              <input
              className={styles.input}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              required
            />
            </div>
            <div className={styles.textLimitBox}>
              <h5 className={styles.h3}>4. 문의 내용 (필수)</h5>
              <div className={styles.textLimit}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="문의 내용을 입력하세요."
                  maxLength={1000}
                  required
                  style={{height: '250px' }}
                />
                <p className={styles.legnthConfirm}>{content.length}자 입력 / 최대 1000자</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.textareaBox}>
          <div className={styles.textareaBox_1}>
            <h5 className={styles.h3}>5. 첨부 파일 (선택)</h5>
            <div className={styles.textarea_1}>
              <div className={styles.textsection}>
                파일명은 - , _를 제외한 특수문자는 허용되지 않습니다.<br/>
                아래 파일 형식만 첨부할 수 있습니다.<br/>
                이미지: .jpeg, .jpg, .gif, .bmp, .png
              </div>
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

            </div>
          </div>

          <div className={styles.textareaBox_2}>
            <h6 className={styles.h3}>6. 개인정보 수집 동의(필수)</h6>
            <div className={styles.textarea_2}>
              <div className={styles.textsection}>
                수집하는 개인정보 항목: 이메일 주소<br/>
                작성해 주시는 개인정보는 문제 접수 및 문제 활용을 위해 3년간 보관됩니다.<br/>
                이용자는 본 동의를 거부할 수 있으나, 미동의 시 문제 접수가 불가능합니다.
              </div>
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
            <button type="submit" className={styles.submitBtn}>등록</button>
            <button 
              type="button" 
              className={styles.submitBtn} 
              onClick={() => navigate('/inquiries' , {
              state: { initialTab: '문제 제출' }
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

export default CustomerProblemSubmit;