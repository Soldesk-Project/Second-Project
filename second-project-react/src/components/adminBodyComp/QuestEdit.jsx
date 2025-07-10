import React, { useState, useEffect } from 'react'; // useEffect 추가

// 카테고리별 주제 데이터를 컴포넌트 외부에 정의 (컴포넌트 렌더링 시마다 재생성 방지)
const subjectOptionsByCategory = {
  '정보처리기사': ['정보시스템 구축관리', '데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '정보처리산업기사': ['정보시스템 구축관리', '데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '정보처리기능사' : ['데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발'],
  '리눅스마스터1급': ['정보시스템 구축관리', '데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '리눅스마스터2급': ['데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '정보통신산업기사': ['데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '정보통신기사': ['정보시스템 구축관리', '데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '정보보안기사': ['정보시스템 구축관리', '데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발', '프로그래밍 언어 활용'],
  '네트워크관리사1급': ['데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발'],
  '네트워크관리사2급': ['데이터베이스 구축', '소프트웨어 설계', '소프트웨어 개발'],
  'default': ['주제를 선택하세요'], // 기본 또는 초기 상태
};

const QuestRegister = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [questionText, setQuestionText] = useState(''); // 문제 본문 상태
  const [options, setOptions] = useState(['', '', '', '']); // 선택지 상태
  const [correctAnswer, setCorrectAnswer] = useState('1'); // 정답 상태

  // 카테고리와 주제 상태 정의 (가장 위로 옮김)
  const [category, setCategory] = useState('정보처리기사'); // 카테고리 상태 (기본값)
  const [subject, setSubject] = useState(''); // 주제 상태 (기본값은 초기화 시 설정)

  // 카테고리가 변경될 때 subject를 초기화하고 새로운 옵션을 설정하는 useEffect
  useEffect(() => {
    const currentSubjects = subjectOptionsByCategory[category] || subjectOptionsByCategory['default'];

    // 현재 선택된 주제가 새로운 카테고리의 옵션에 없으면 첫 번째 옵션으로 초기화
    if (!currentSubjects.includes(subject)) {
      setSubject(currentSubjects[0] || ''); // 첫 번째 옵션으로 설정 또는 빈 값
    }
  }, [category, subject]); // category가 바뀔 때, 또는 subject가 직접 변경될 때 (선택지에서 사라지는 경우)

  // 카테고리 변경 핸들러
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    // 카테고리 변경 시 주제도 초기화 (useEffect에서 첫 번째 주제로 자동 설정됨)
    // setSubject(''); // 이렇게 강제로 초기화할 수도 있지만, useEffect가 더 유연합니다.
  };

  // 주제 변경 핸들러
  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  // 렌더링할 현재 주제 옵션 목록 가져오기
  const currentSubjectOptions = subjectOptionsByCategory[category] || subjectOptionsByCategory['default'];


  // 이미지 선택 핸들러
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setPreviewImage(null);
    }
  };

  // 이미지 업로드 제출 핸들러 (개별 함수로 분리)
  const handleImageUploadSubmit = async (event) => {
    event.preventDefault(); // 폼의 기본 제출 동작 방지

    if (!selectedImage) {
      alert('이미지를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      // 실제 API 엔드포인트로 변경하세요.
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert('이미지 업로드 성공: ' + result.imageUrl);
        // 업로드 성공 후 상태 초기화 (필요시)
        // setSelectedImage(null);
        // setPreviewImage(null);
      } else {
        alert('이미지 업로드 실패');
        const errorData = await response.json(); // 에러 메시지 확인
        console.error('이미지 업로드 실패 상세:', errorData);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  // 전체 문제 수정 제출 핸들러
  const handleQuestEditSubmit = async () => {
    const questData = {
      category: category,
      subject: subject,
      questionText: questionText,
      options: options,
      correctAnswer: correctAnswer,
    };

    console.log('수정할 문제 데이터:', questData);
    alert('문제 수정 로직 실행됨 (콘솔 확인)'); // 임시 알림
  };

  // 폼 초기화 핸들러
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('1');
    setCategory('정보처리기사'); // 초기 카테고리로 재설정
    setSubject(subjectOptionsByCategory['정보처리기사'][0] || ''); // 초기 카테고리의 첫 번째 주제로 재설정
  };

  // 컴포넌트 마운트 시 초기 주제 설정 (기본 카테고리 '정보처리기사'에 대한 주제)
  useEffect(() => {
    if (subject === '') { // subject가 초기값일 때만 설정
        setSubject(subjectOptionsByCategory[category][0] || '');
    }
  }, []); // 빈 배열: 컴포넌트가 처음 마운트될 때 한 번만 실행

  return (
    <div>
      <h1>문제 수정</h1>
      <br/>
      <div className='category'>
        <h3>1. 카테고리 선택</h3>
        <select name="cateSelect" value={category} onChange={handleCategoryChange}>
          {Object.keys(subjectOptionsByCategory)
            .filter(key => key !== 'default') // 'default' 키는 옵션으로 보여주지 않음
            .map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <br/>
      <div className='subject'>
        <h3>2. 주제 선택</h3>
        <select name="subjSelect" value={subject} onChange={handleSubjectChange}>
          {currentSubjectOptions.map((subj, index) => (
            <option key={subj + index} value={subj}>
              {subj}
            </option>
          ))}
        </select>
      </div>
      <br/>
      <div className='questionText'>
        <h3>3. 문제 본문 입력</h3>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          style={{ width: '80%', padding: '5px' }}
          placeholder="문제 본문을 입력하세요."
        />
      </div>
      <br/>
      <div className='option'>
        <h3>4. 선택지 입력</h3>
        {options.map((option, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
              style={{ width: '70%', padding: '5px' }}
              placeholder={`${index + 1}번 선택지를 입력하세요.`}
            />
          </div>
        ))}
      </div>
      <br/>
      <div className='corAnswer'>
        <h3>5. 정답 입력</h3>
        <select name="corAnsSelect" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
          {options.map((_, index) => (
            <option key={index + 1} value={String(index + 1)}>{index + 1}</option>
          ))}
        </select>
      </div>
      <br/>
      <div className="photoInput">
        <h3>6. 이미지 업로드 (선택 사항)</h3>
        <form onSubmit={handleImageUploadSubmit}>
          <div>
            <label htmlFor="image-upload">이미지 선택:</label>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          {previewImage && (
            <div style={{ marginTop: '20px' }}>
              <h3>이미지 미리보기:</h3>
              <img src={previewImage} alt="Image Preview" style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ddd' }} />
            </div>
          )}
          <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }}>
            이미지 업로드
          </button>
        </form>
      </div>
      <br/>
      <button onClick={handleReset} style={{ marginRight: '10px', padding: '10px 20px' }}>초기화</button>
      <button onClick={handleQuestEditSubmit} style={{ padding: '10px 20px' }}>수정 완료</button>
    </div>
  );
};

export default QuestRegister;