import React, { useState, useEffect, useRef } from 'react';
import '../../css/adminPage/Edit.css';
import styles from '../../css/adminPage/QuestErrRepoManage.module.css';

const QuestEdit = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('1');
  const [subject, setSubject] = useState('정보처리기사');
  const [base64ImageString, setBase64ImageString] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuestionsToDelete, setSelectedQuestionsToDelete] = useState(new Set());
  // 한 페이지에 보이는 문제 개수를 5개로 변경
  const itemsPerPage = 5;
  const [startPage, setStartPage] = useState(1);
  const pagesToShow = 5;
  const token = localStorage.getItem('token');

  // 이전 검색어를 저장할 useRef (searchQuery가 변경되었는지 확인하기 위함)
  const lastSearchQuery = useRef('');

  const subjects = [
    '정보처리기사', '정보처리산업기사', '정보처리기능사',
    '리눅스마스터1급', '리눅스마스터2급',
    '정보통신산업기사', '정보통신기사', '정보보안기사',
    '네트워크관리사1급', '네트워크관리사2급',
  ];

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

  const handleSubjectChange = (e) => {
    const selectedSubject = e.target.value;
    setSubject(selectedSubject);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedQuestId(null); // 과목 변경 시 선택된 문제 초기화
    handleReset();
    setCurrentPage(1);
    setTotalPages(1);
    setStartPage(1);
    lastSearchQuery.current = '';
  };

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

  const handleSearchQuest = async (page = 1) => {
    const dbSubjectValue = subjectValueMap[subject];
    if (!dbSubjectValue) {
      alert('유효하지 않은 과목입니다.');
      return;
    }

    if (searchQuery !== lastSearchQuery.current || page === 1) {
      setStartPage(1);
    }
    lastSearchQuery.current = searchQuery;

    try {
      const response = await fetch(`/admin/searchQuestions?subject=${encodeURIComponent(dbSubjectValue)}&query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      console.log(data.questions);
      
      setSearchResults(data.questions);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

      if (page < startPage || page >= startPage + pagesToShow) {
        setStartPage(Math.floor((page - 1) / pagesToShow) * pagesToShow + 1);
      }

    } catch (error) {
      console.error('문제 검색 중 오류 발생:', error);
      alert('문제 검색 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      setSearchResults([]);
      setTotalPages(1);
      setCurrentPage(1);
      setStartPage(1);
    }
  };

  const handleSelectQuest = (question) => {
    // 이미 선택된 문제를 다시 클릭하면 드롭다운을 닫고 초기화
    if (selectedQuestId === question.id) {
      setSelectedQuestId(null);
      handleReset();
    } else {
      setSelectedQuestId(question.id);
      setQuestionText(question.question_text);
      setOptions([
        question.option_1,
        question.option_2,
        question.option_3,
        question.option_4,
      ]);
      setCorrectAnswer(String(question.correct_answer));

      if (question.image_data_base64) {
        setBase64ImageString(question.image_data_base64);
        setPreviewImage(`data:image/png;base64,${question.image_data_base64}`);
      } else {
        setBase64ImageString('');
        setPreviewImage(null);
      }
    }
  };
  
  const handleQuestEditSubmit = async () => {
    if (selectedQuestId === null) {
      alert('수정할 문제를 먼저 선택해주세요.');
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

    const dbSubjectValue = subjectValueMap[subject]; // subject state 값을 사용합니다.
    if (!dbSubjectValue) {
      alert('유효하지 않은 과목입니다. 다시 선택해주세요.');
      return;
    }

    const questData = {
      id: selectedQuestId,
      subject: dbSubjectValue,
      question_text: questionText,
      option_1: options[0],
      option_2: options[1],
      option_3: options[2],
      option_4: options[3],
      correct_answer: parseInt(correctAnswer),
      image_data_base64: base64ImageString,
    };

    if (base64ImageString !== '') {
      questData.image_data_base64 = base64ImageString;
    }

    try {
      const response = await fetch(`/admin/editQuestion?`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questData),
      });

      if (response.ok) {
        alert('문제 수정 성공!');
        handleReset();
        // 수정 완료 후 선택된 문제 ID를 초기화하여 드롭다운 닫기
        setSelectedQuestId(null);
        // 검색 결과 목록을 새로고침하여 수정된 내용 반영
        handleSearchQuest(currentPage);
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('문제 수정 실패 상세:', errorData);
          alert('문제 수정 실패: ' + (errorData.message || '알 수 없는 오류'));
        } else {
          console.error('문제 수정 실패: 서버 응답 형식 오류');
          alert('문제 수정 실패: 서버 응답 오류. 콘솔을 확인하세요.');
        }
      }
    } catch (error) {
      console.error('문제 수정 오류:', error);
      alert('문제 수정 중 클라이언트 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('1');
    setBase64ImageString('');
  };

  const handleDeleteSelectedQuests = async (selectedQuestId) => {

    const dbSubjectValue = subjectValueMap[subject];

    const isConfirmed = window.confirm("선택된 문제를 정말 삭제하시겠습니까?");
    if (!isConfirmed) return; // 취소 시 함수 종료

    try {
      const response = await fetch(
        `/admin/deleteQuestions?subject=${encodeURIComponent(dbSubjectValue)}&ids=${encodeURIComponent(selectedQuestId)}`,
        {
          method: 'DELETE',
          headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
        }
      );

      if (response.ok) {
        alert('선택된 문제가 성공적으로 삭제되었습니다.');
        setSelectedQuestionsToDelete(new Set());
        setSelectedQuestId(null); // 삭제 후 상세 정보 초기화
        handleSearchQuest(currentPage); // 현재 페이지를 다시 불러와 목록 업데이트
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error('문제 삭제 실패 상세:', errorData);
          alert('문제 삭제 실패: ' + (errorData.message || '알 수 없는 오류'));
        } else {
          console.error('문제 삭제 실패: 서버 응답 형식 오류');
          alert('문제 삭제 실패: 서버 응답 오류. 콘솔을 확인하세요.');
        }
      }
    } catch (error) {
      console.error('문제 삭제 중 클라이언트 오류:', error);
      alert('문제 삭제 중 클라이언트 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    // 페이지 로드 시 첫 페이지 문제 자동 검색
    handleSearchQuest(1);
  }, [subject]);

  return (
    <div>
      <h1 className={styles.title}>문제 수정</h1>
      <div className='category'>
        <select name="cateSelect" value={subject} onChange={handleSubjectChange}>
          {subjects.map((subject, index) => (
            <option key={index} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="문제 본문 검색어를 입력하세요."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearchQuest(1);
            }
          }}
        />
        <button onClick={() => handleSearchQuest(1)} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className='searchResults'>
          <h3>검색 결과 ({searchResults.length}개): 문제를 클릭하여 수정하세요.</h3>
          <ul>
            {searchResults.map((quest) => (
              <React.Fragment key={quest.id}>
                <li
                  onClick={() => handleSelectQuest(quest)}
                  className={selectedQuestId === quest.id ? 'selected-edit' : ''}
                >
                  <span className="quest-id">[ID: {quest.id}]</span>
                  {quest.question_text.length > 80 ? quest.question_text.substring(0, 80) + '...' : quest.question_text}
                </li>
                {/* 선택된 문제 수정 내용은 해당 문제 칸의 아래에 드롭다운 형태로 나오게 할 것 */}
                {selectedQuestId === quest.id && (
                  <div className='question-detail-form dropdown-content'>
                    <h2>선택된 <strong>{selectedQuestId}</strong>번 문제 수정 ✏️</h2>
                    <div className='questionText'>
                      <h3>1. 문제 본문 입력</h3>
                      <input
                        type="text"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="문제 본문을 입력하세요."
                      />
                    </div>
                    <div className='option'>
                      <h3>2. 선택지 입력</h3>
                      {options.map((option, index) => (
                        <div key={index}>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...options];
                              newOptions[index] = e.target.value;
                              setOptions(newOptions);
                            }}
                            placeholder={`${index + 1}번 선택지를 입력하세요.`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className='corAnswer'>
                      <h3>3. 정답 입력</h3>
                      <select name="corAnsSelect" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                        {options.map((_, index) => (
                          <option key={index + 1} value={String(index + 1)}>{index + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="photo-input-section">
                      <h3 className="section-title">4. 이미지 업로드 (선택 사항)</h3>
                      <div className="image-upload-wrapper">
                        <label htmlFor="image-upload" className="image-upload-label">이미지 선택:</label>
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="image-upload-input"
                        />
                      </div>
                      {previewImage && (
                        <div className="image-preview-container">
                          <h3 className="image-preview-title">이미지 미리보기:</h3>
                          <img src={previewImage} alt="Image Preview" className="image-preview" />
                        </div>
                      )}
                    </div>
                    <div className="button-group">
                      <button onClick={handleReset} className="reset-button">현재 내용 초기화</button>
                      <button onClick={handleQuestEditSubmit} className="submit-button">수정 완료</button>
                      <button onClick={()=>handleDeleteSelectedQuests(selectedQuestId)} className="delete-button">삭제</button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              {/* 이전 버튼 */}
              <button
                onClick={() => setStartPage(prev => Math.max(1, prev - pagesToShow))}
                disabled={startPage === 1}
                className="pagination-button"
              >
                이전
              </button>

              {/* 페이지 번호들 */}
              {Array.from({ length: pagesToShow }, (_, i) => startPage + i)
                .filter(pageNumber => pageNumber <= totalPages)
                .map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => handleSearchQuest(pageNumber)}
                    className={currentPage === pageNumber ? 'active pagination-button' : 'pagination-button'}
                  >
                    {pageNumber}
                  </button>
                ))}

              {/* 다음 버튼 */}
              <button
                onClick={() => setStartPage(prev => prev + pagesToShow)}
                disabled={startPage + pagesToShow > totalPages}
                className="pagination-button"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestEdit;