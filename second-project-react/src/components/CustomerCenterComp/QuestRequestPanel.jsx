import React, { useState } from 'react';
import styles from '../../css/customer.module.css';
import { useSelector } from 'react-redux';

const QuestRequestPanel = () => {
    const [consent, setConsent] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState('1');
    const [subject, setSubject] = useState('정보처리기사');
    const [base64ImageString, setBase64ImageString] = useState('');
  
    // 사용자에게 보여줄 과목 목록
    const subjects = [
      '정보처리기사',
      '정보처리산업기사',
      '정보처리기능사',
      '리눅스마스터1급',
      '리눅스마스터2급',
      '정보통신산업기사',
      '정보통신기사',
      '정보보안기사',
      '네트워크관리사1급',
      '네트워크관리사2급',
    ];
  
    // 사용자에게 보이는 과목명과 DB에 저장될 실제 값을 매핑하는 Map
    const subjectValueMap = {
      '정보처리기사': 'cpe',
      '정보처리산업기사': 'cpei',
      '정보처리기능사': 'cpet',
      '리눅스마스터1급': 'lm1',
      '리눅스마스터2급': 'lm2',
      '정보통신산업기사': 'icti',
      '정보통신기사': 'ict',
      '정보보안기사': 'sec',
      '네트워크관리사1급': 'net1',
      '네트워크관리사2급': 'net2',
    };

    const user = useSelector(state => state.user);
    const userNo = user?.user?.user_no;
  
    const handleSubjectChange = (e) => {
      setSubject(e.target.value);
    };
  
    // 이미지 선택 핸들러
    const handleImageChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
          const base64 = reader.result.split(',')[1];
          setBase64ImageString(base64);
        };
        reader.readAsDataURL(file);
      } else {
        setSelectedImage(null);
        setPreviewImage(null);
        setBase64ImageString('');
      }
    };
  
    // 전체 문제 등록 제출 핸들러
    const handleQuestRegisterSubmit = async () => {
      // 필수 입력 필드 검증
      if (!consent) {
      return alert('개인정보 수집 동의가 필요합니다.');
      }
      if (!subject.trim()) {
        alert('카테고리를 선택해주세요.');
        return;
      }
      if (!questionText.trim()) {
        alert('문제 본문을 입력해주세요.');
        return;
      }
      for (let i = 0; i < options.length; i++) {
        if (!options[i].trim()) {
          alert(`${i + 1}번 선택지를 입력해주세요.`);
          return;
        }
      }
      if (!correctAnswer.trim()) {
        alert('정답을 선택해주세요.');
        return;
      }
  
      // `subjectValueMap`을 사용하여 실제 DB에 저장될 값을 가져옴
      const dbSubjectValue = subjectValueMap[subject];
      console.log('클라이언트에서 서버로 보낼 subject 값:', dbSubjectValue);
      if (!dbSubjectValue) {
        alert('유효하지 않은 과목입니다.');
        return;
      }
  
      const questData = {
        user_no: userNo,
        subject: dbSubjectValue,
        question_text: questionText,
        option_1: options[0],
        option_2: options[1],
        option_3: options[2],
        option_4: options[3],
        correct_answer: parseInt(correctAnswer),
        image_data_base64: base64ImageString,
      };
  
      try {
        const response = await fetch(`/api/customer/questRequest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questData),
        });
  
        if (response.ok) {
          alert('문제 등록 요청 성공!');
          handleReset(); // 성공 시 폼 초기화
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error('문제 등록 요청 실패 상세:', errorData);
            alert('문제 등록 요청 실패: ' + (errorData.message || '알 수 없는 오류'));
          }
        }
      } catch (error) {
        console.error('문제 등록 요청 오류:', error);
        alert('문제 등록 요청 중 오류가 발생했습니다.');
      }
    };
  
    const handleReset = () => {
      setConsent('');
      setSelectedImage(null);
      setPreviewImage(null);
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('1');
      setSubject('정보처리기사');
      setBase64ImageString('');
    };
  
    return (
      <form className={styles.inqueriesBox} onSubmit={handleQuestRegisterSubmit}>
        <div className={styles.inqContainer}>
          {/* 1. 카테고리 선택 */}
          <fieldset>
            <legend>1. 카테고리 선택</legend>
            <select name="cateSelect" value={subject} onChange={handleSubjectChange} className={styles.input}>
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>{subject}</option>
              ))}
            </select>
          </fieldset>

          {/* 2. 문제 본문 입력 */}
          <fieldset>
            <legend>2. 문제 본문 입력</legend>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className={styles.input}
              placeholder="문제 본문을 입력하세요."
            />
          </fieldset>

          {/* 3. 선택지 입력 */}
          <fieldset>
            <legend>3. 선택지 입력</legend>
            <div className={styles.optionGroup}>
              {options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  className={styles.optionInput}
                  placeholder={`${index + 1}번 선택지를 입력하세요.`}
                />
              ))}
            </div>
          </fieldset>

          {/* 4. 정답 입력 */}
          <fieldset>
            <legend>4. 정답 입력</legend>
            <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className={styles.input}>
              {options.map((_, index) => (
                <option key={index} value={String(index + 1)}>{index + 1}</option>
              ))}
            </select>
          </fieldset>

          {/* 5. 이미지 업로드 */}
          <fieldset>
            <legend>5. 이미지 업로드 (선택 사항)</legend>
            <label htmlFor="image-upload" className={styles.uploadLabel}>이미지 선택:</label>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{display: 'none'}}
            />
            {previewImage && (
              <div className={styles.image_preview_container}>
                <h4 className={styles.image_preview_title}>이미지 미리보기</h4>
                <img src={previewImage} alt="Image Preview" className={styles.image_preview}/>
              </div>
            )}
          </fieldset>

          {/* 6. 개인정보 수집 동의 */}
          <fieldset>
            <legend>6. 개인정보 수집 동의 (필수)</legend>
            <div className={styles.textsection}>
              수집하는 개인정보 항목: 이메일 주소<br/>
              작성해 주시는 개인정보는 문제 접수 및 문제 활용을 위해 3년간 보관됩니다.<br/>
              이용자는 본 동의를 거부할 수 있으나, 미동의 시 문제 접수가 불가능합니다.
            </div>
            <label>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              &nbsp;동의합니다.
            </label>
          </fieldset>
        </div>

        {/* 버튼 그룹 */}
        <div className={styles.buttonGroup}>
          <button type="reset" className={styles.resetButton} onClick={handleReset}>초기화</button>
          <button type="submit" className={styles.submitButton}>제출</button>
        </div>
      </form>
    );
  };

export default QuestRequestPanel;