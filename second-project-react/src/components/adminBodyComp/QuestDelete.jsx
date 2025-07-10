import React, { useState } from 'react';

// 가상의 문제 데이터 (실제로는 API 호출 등을 통해 가져올 수 있습니다)
const allQuestionData = [
  {
    id: 1,
    category: '정보처리기사',
    questionNum: '1',
    topic: '데이터베이스',
    content: '관계형 데이터베이스의 특징은?',
    option1: 'A',
    option2: 'B',
    option3: 'C',
    option4: 'D',
    answer: 1,
  },
  {
    id: 2,
    category: '정보처리산업기사',
    questionNum: '6',
    topic: '운영체제',
    content: '데드락 발생 조건은?',
    option1: '옵션1',
    option2: '옵션2',
    option3: '옵션3',
    option4: '옵션4',
    answer: 2,
  },
  {
    id: 3,
    category: '정보처리기사',
    questionNum: '4',
    topic: '자료구조',
    content: '트리 구조의 순회 방법 중 전위 순회는?',
    option1: '전위',
    option2: '중위',
    option3: '후위',
    option4: '레벨',
    answer: 1,
  },
  {
    id: 4,
    category: '리눅스마스터2급',
    questionNum: '1',
    topic: '리눅스 명령어',
    content: '파일 내용을 출력하는 명령어는?',
    option1: 'ls',
    option2: 'cd',
    option3: 'cat',
    option4: 'mkdir',
    answer: 3,
  },
];

// 카테고리 목록을 배열로 정의
const categories = [
  '전체',
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

const QuestDelete = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // 카테고리 버튼 클릭 핸들러
  // 이 함수 자체가 이미 const로 정의되어 분리된 형태입니다.
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  // 선택된 카테고리에 따라 데이터를 필터링
  const filteredQuestions = allQuestionData.filter(question => {
    if (selectedCategory === '전체') {
      return true;
    }
    return question.category === selectedCategory;
  });

  return (
    <div>
      <h1>문제 삭제</h1>
      <div className='category'>
        {/* categories 배열을 map 함수로 순회하며 버튼 렌더링 */}
        {categories.map((category) => (
          <button
            key={category} // 각 버튼에 고유한 key prop 제공
            onClick={() => handleCategoryClick(category)}
            className={selectedCategory === category ? 'active' : ''}
          >
            {category}
          </button>
        ))}
      </div>
      <br />
      <table className='question'>
        <thead>
          <tr>
            <th>카테고리</th>
            <th>문제 번호</th>
            <th>주제</th>
            <th>문제 본문</th>
            <th>옵션 1</th>
            <th>옵션 2</th>
            <th>옵션 3</th>
            <th>옵션 4</th>
            <th>정답 번호</th>
            <th>선택</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((question) => (
            <tr key={question.id}>
              <td>{question.category}</td>
              <td>{question.questionNum}</td>
              <td>{question.topic}</td>
              <td>{question.content}</td>
              <td>{question.option1}</td>
              <td>{question.option2}</td>
              <td>{question.option3}</td>
              <td>{question.option4}</td>
              <td>{question.answer}</td>
              <td>
                <input type="checkbox" name="selectQuestion" value={question.id} />
              </td>
            </tr>
          ))}
          {filteredQuestions.length === 0 && (
            <tr>
              <td colSpan="10">해당 카테고리의 문제가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
      <br />
      <button>삭제</button>
    </div>
  );
};

export default QuestDelete;