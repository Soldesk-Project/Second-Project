import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../../css/customer.module.css'; 

const PAGE_SIZE = 10; 

const InquiryPanel = () => {
  const [inquiries, setInquiries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [openInquiryId, setOpenInquiryId] = useState(null);
   const [passwordInput, setPasswordInput] = useState('');
  const [passwordValidatedInquiries, setPasswordValidatedInquiries] = useState({}); 
  const [passwordError, setPasswordError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await axios.get(`/api/customer/inquiries?page=${page}&size=${PAGE_SIZE}`);
        console.log("Inquiries data received:", res.data);
        setInquiries(res.data.items);
        setTotalInquiries(res.data.totalCount);
      } catch (error) {
        console.error("1:1 문의 데이터를 가져오는 데 실패했습니다.", error);
        setInquiries([]);
        setTotalInquiries(0);
      }
    };
    fetchInquiries();
  }, [page]);

  const toggleDetails = (id) => {
    // 이미 열려있는 게시글을 다시 클릭하면 닫기
    if (openInquiryId === id) {
      setOpenInquiryId(null);
      setPasswordInput('');
      setPasswordError(null);
    } else {
      // 새로운 게시글을 열 경우
      setOpenInquiryId(id);
      setPasswordInput('');
      setPasswordError(null);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordInput(e.target.value);
  };

  const handlePasswordSubmit = async (id) => {
    setPasswordError(null); // 이전 오류 메시지 초기화

    // 입력된 비밀번호가 숫자인지 확인 (백엔드 `int` 타입 매핑에 맞춰)
    const passwordAsNumber = parseInt(passwordInput, 10);
    if (isNaN(passwordAsNumber)) {
        setPasswordError('비밀번호는 숫자여야 합니다.');
        return;
    }

    try {
      const res = await axios.post(`/api/customer/inquiries/${id}/check-password`, { 
        postPassword: passwordAsNumber // 숫자로 변환하여 전송
      });
      
      if (res.data.isValid) {
        // 비밀번호 일치: 해당 문의 ID를 '검증됨' 상태로 설정
        setPasswordValidatedInquiries(prev => ({ ...prev, [id]: true }));
        setPasswordInput(''); // 입력창 비우기
      } else {
        // 비밀번호 불일치: 오류 메시지 표시
        setPasswordError('비밀번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error("비밀번호 확인 실패:", error);
      // 서버 응답 오류 등에 대한 일반적인 오류 메시지
      setPasswordError('비밀번호 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalInquiries / PAGE_SIZE));
  };

  return (
    <section className={styles.content}>
      {/* 리스트 헤더 */}
      <ul className={styles.listHeader}>
        <li>번호</li>
        <li>제목</li>
        <li>닉네임</li>
        <li>날짜</li>
      </ul>
      {/* 1:1 문의 리스트 */}
      <ul className={styles.listView}>
        {inquiries.length > 0 ? (
          inquiries.map(item => (
            <li key={item.id} className={styles.listItem}>
              <div 
                className={styles.listItemHeader} 
                onClick={() => toggleDetails(item.id)}
              >
                <span className={styles.listItemNo}>{item.id}</span>
                <span className={styles.listItemTitle}>
                  {item.subject}
                </span>
                <span className={styles.listItemAuthor}>{item.userNick}</span> {/* userNick -> listItemAuthor */}
                <span className={styles.listItemDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {openInquiryId === item.id && (
                <div className={styles.detailContentArea}>
                  {!passwordValidatedInquiries[item.id] ? (
                    <div className={styles.passwordInputArea}>
                      <p className={styles.passwordPrompt}>이 게시글은 비밀글입니다. 비밀번호를 입력해주세요.</p>
                      <input 
                        type="password" 
                        value={passwordInput} 
                        onChange={handlePasswordChange} 
                        className={styles.passwordInputField}
                        placeholder="비밀번호"
                        onKeyPress={(e) => { // 엔터 키로 제출
                          if (e.key === 'Enter') {
                            handlePasswordSubmit(item.id);
                          }
                        }}
                      />
                      <button 
                        onClick={() => handlePasswordSubmit(item.id)}
                        className={styles.passwordSubmitButton}
                      >
                        확인
                      </button>
                      {passwordError && <p className={styles.passwordError}>{passwordError}</p>}
                    </div>
                  ) : (
                  <div className={styles.detailContent}>
                    {item.message && item.message.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                    {item.files && item.files.length > 0 && (
                      <div className={styles.attachmentArea}>
                        <h4>첨부파일:</h4>
                        <ul className={styles.attachmentList}>
                          {item.files.map((file, fileIndex) => (
                            <li key={fileIndex}>
                              <a 
                                href={file.filepath} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.attachmentLink}
                              >
                                {file.filename}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
            </li>
          ))
        ) : (
          <li className={styles.noData}>1:1 문의 내역이 없습니다.</li>
        )}
      </ul>

      {/* 새 글 등록 버튼 및 페이징 */}
      <div className={styles.listFooter}>
        <button
          className={styles.primaryButton}
          onClick={() => navigate('/inquiry')}
        >
          새 글 등록
        </button>

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

export default InquiryPanel;