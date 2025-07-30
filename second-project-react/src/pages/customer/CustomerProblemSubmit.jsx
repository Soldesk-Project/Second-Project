import React, { useRef, useState, useEffect } from 'react';
import styles from '../../css/customer.module.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CustomerProblemSubmit = () => {
  const navigate = useNavigate();
  const [postPassword, setPostPassword] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [probCate, setProbCate] = useState('');
  const [probSub, setProbSub] = useState('');
  const [probMessage, setProbMessage] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [base64ImageStrings, setBase64ImageStrings] = useState([]);
  const fileInputRef = useRef(null);

  // 카테고리 목록
  const categories = [
    '결제 관련', '계정 관련', '게임 관련', '사이트 기술적 문제'
  ];

  // 사용자에게 보이는 카테고리명과 DB에 저장될 실제 값을 매핑하는 Map
  const cateTableMap = {
    '결제 관련': 'payment', '계정 관련': 'account', '게임 관련': 'gameplay', '사이트 기술적 문제': 'technical',
  };

  const user = useSelector(state => state.user);
  const userId = user?.user?.user_id;

  useEffect(() => {
    if (!userId) {
        alert("로그인 후 문의를 이용해주세요.");
        navigate('/login');
    }
  }, [userId, navigate]);

  // 카테고리 변경 핸들러
  const handleCateChange = (e) => {
    setProbCate(e.target.value);
  };

  // 첨부 파일 핸들러
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    setSelectedImageFiles(selectedFiles); 

    const newPreviewUrls = [];
    const newBase64Strings = [];
    let filesProcessed = 0;

    if (selectedFiles.length === 0) {
        setPreviewImages([]);
        setBase64ImageStrings([]);
        return;
    }

    selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            newPreviewUrls.push(reader.result);
            newBase64Strings.push(reader.result.split(',')[1]);

            filesProcessed++;
            if (filesProcessed === selectedFiles.length) {
                setPreviewImages(newPreviewUrls);
                setBase64ImageStrings(newBase64Strings);
            }
        };
        reader.readAsDataURL(file);
    });
  };

  const triggerFileInput = () => fileInputRef.current.click();

  // 폼 제출 핸들러
  const handleProbSubmit = async (e) => {
    e.preventDefault();

    if (!consent) {
      return alert('개인정보 수집 동의가 필요합니다.');
    }

    if (!probCate.trim()) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!probSub.trim()) {
      alert('문의 제목을 입력해주세요.');
      return;
    }
    if (!probMessage.trim()) {
      alert('문의 본문을 입력해주세요.');
      return;
    }

    const dbProbCateValue = cateTableMap[probCate];
    if (!dbProbCateValue) {
      alert('유효하지 않은 카테고리입니다.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('postPassword', postPassword);
    formData.append('email', email); 
    formData.append('category', dbProbCateValue);
    formData.append('subject', probSub);
    formData.append('message', probMessage);

    selectedImageFiles.forEach((file, index) => {
      formData.append(`files`, file);
    });

    try {
      const response = await axios.post(
        'http://localhost:9099/api/customer/inquiry',
        formData,
        {
          headers: {
          }
        }
      );
      if (response.status === 200 || response.status === 201) {
        alert('문제가 정상적으로 등록되었습니다.');
        setPostPassword('');
        setEmail('');
        setConsent(false);
        setProbCate('');
        setProbSub('');
        setProbMessage('');
        setSelectedImageFiles([]);
        setPreviewImages([]);
        setBase64ImageStrings([]);

        navigate('/inquiries');
      } else {
        const errorData = response.data;
        console.error('문의 등록 실패 상세:', errorData);
        alert('문의 등록 실패: ' + (errorData.message || '알 수 없는 오류가 발생했습니다.'));
      }
    } catch (err) {
      console.error('등록 중 오류 발생:', err.response ? err.response.data : err.message);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.customerServiceCenter}>
      <div className={styles.inqueriesBox}>
        <form onSubmit={handleProbSubmit}>
          <div className={styles.title}>
            <h1 style={{ color: 'white' }}>문의 접수</h1>
          </div>
          <div className={styles.explanation}>
            <p>접수하신 문의가 등록되었는지의 유무는 유저의 이메일로 안내해드리고 있습니다.</p>
            <p>보내주신 문의는 서비스 개선을 위해 소중히 활용하고 있습니다.</p>
          </div>

          <div className={styles.inqContainer}>
            {/* 1. 게시글 비밀번호*/}
            <h3 className={styles.h3}>1. 게시글 비밀번호</h3>
            <input
              className={styles.input}
              type="password"
              value={postPassword}
              onChange={e => setPostPassword(e.target.value)}
              placeholder="게시글 비밀번호를 입력하세요"
              required
            />
            {/* 2. 이메일*/}
            <h3 className={styles.h3}>2. 이메일</h3>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="문의 결과 안내받을 이메일을 입력하세요"
              required
            />
            {/* 3. 카테고리 선택*/}
            <h3 className={styles.h3}>3. 카테고리 선택</h3>
            <select
              name="cateSelect"
              value={probCate}
              onChange={handleCateChange}
              className={styles.input}
            >
              {/* 첫 번째 옵션 추가 */}
              {categories.map((cate, index) => (
                <option key={index} value={cate}>
                  {cate}
                </option>
              ))}
            </select>
            {/* 4. 문의 제목 입력*/}
            <h3 className={styles.h3}>4. 문의 제목 입력</h3>
            <input
              className={styles.input}
              type="text"
              value={probSub}
              onChange={(e) => setProbSub(e.target.value)}
              placeholder="문의 제목을 입력하세요."
              required
            />
            {/* 5. 문의 본문 입력*/}
            <h3 className={styles.h3}>5. 문의 본문 입력</h3>
            <textarea
              value={probMessage}
              onChange={(e) => setProbMessage(e.target.value)}
              className={styles.textarea}
              placeholder="문의 본문을 입력하세요."
              required
            />
            <p className={styles.legnthConfirm}>{probMessage.length}자 입력 / 최대 1000자</p>
            {/* 6. 첨부 파일 */}
            <div className={styles.fileInputGroup}>
              <h3 className={styles.h3}>6. 첨부 파일 (선택)</h3>
              <div className={styles.textsection}>
                파일명은 - , _를 제외한 특수문자는 허용되지 않습니다.<br/>
                아래 이미지 파일 형식만 첨부할 수 있습니다.<br/>
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
              <button type="button" className={styles.submitBtn} onClick={triggerFileInput}>파일 첨부</button>
              {/* 첨부된 파일명 목록 */}
              {selectedImageFiles.length > 0 && (
                <ul style={{ color: 'white', listStyle: 'none', padding: '10px 0 0 0' }}>
                  {selectedImageFiles.map((file, idx) => (
                    <li key={idx} style={{ marginBottom: '5px' }}>
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}
              {/* 이미지 미리보기 출력 */}
              {previewImages.length > 0 && (
                <div className={styles.image_preview_container}>
                  <h3 className={styles.image_preview_title}>이미지 미리보기:</h3>
                  <div>
                    {previewImages.map((url, idx) => (
                      <div key={idx} className={styles.image_thumbnail_wrapper}>
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className={styles.image_preview}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 7. 개인정보 수집 동의 (필수) */}
            <h3 className={styles.h3}>7. 개인정보 수집 동의 (필수)</h3>
            <div className={styles.textsection}>
              수집하는 개인정보 항목: 이메일 주소<br/>
              작성해 주시는 개인정보는 문제 접수 및 문제 활용을 위해 3년간 보관됩니다.<br/>
              이용자는 본 동의를 거부할 수 있으나, 미동의 시 문제 접수가 불가능합니다.
            </div>
            <div>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
              />&nbsp;<span>동의합니다.</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className={styles.inqBtns}>
            <button type="submit" className={styles.submitBtn}>등록</button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => navigate('/inquiries', {
                state: { initialTab: '문제 제출' }
              })}
            >
              돌아가기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerProblemSubmit;