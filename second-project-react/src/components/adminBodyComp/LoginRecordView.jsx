import React, { useState, useEffect } from 'react';

// 더미 데이터 배열
const dummyRecords = [
  {
    userId: 'user123',
    userNick: '개발왕김코딩',
    userStartTime: '2025-07-11T14:00:00Z',
    userEndTime: '2025-07-11T14:30:00Z',
  },
  {
    userId: 'guest_A',
    userNick: '익명의방문자',
    userStartTime: '2025-07-11T15:05:00Z',
    userEndTime: null, // 접속 중
  },
  {
    userId: 'admin_01',
    userNick: '관리자',
    userStartTime: '2025-07-10T09:00:00Z',
    userEndTime: '2025-07-10T10:00:00Z',
  },
  {
    userId: 'user123',
    userNick: '개발왕김코딩',
    userStartTime: '2025-07-10T18:00:00Z',
    userEndTime: '2025-07-10T19:00:00Z',
  },
  {
    userId: 'testuser',
    userNick: '테스트계정',
    userStartTime: '2025-07-11T12:00:00Z',
    userEndTime: '2025-07-11T12:05:00Z',
  },
  {
    userId: 'guest_B',
    userNick: '익명의사용자',
    userStartTime: '2025-07-11T15:10:00Z',
    userEndTime: '2025-07-11T15:12:00Z',
  },
];

const LoginRecordView = () => {
  const [loginRecords, setLoginRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('userId');
  const [loading, setLoading] = useState(false);
  
  // 데이터 페칭(더미) 함수
  const fetchLoginRecords = () => {
    setLoading(true);
    
    // API 호출을 흉내내기 위해 1초 지연
    setTimeout(() => {
      // 1. 검색어 필터링
      const filteredRecords = dummyRecords.filter(record => {
        // 검색어가 비어있으면 모든 데이터를 반환
        if (!searchTerm) {
          return true;
        }
        
        // 소문자로 변환하여 검색 (대소문자 구분 없이)
        const valueToSearch = record[searchField].toLowerCase();
        return valueToSearch.includes(searchTerm.toLowerCase());
      });
      
      // 2. 시간 내림차순 정렬
      const sortedRecords = filteredRecords.sort((a, b) => 
        new Date(b.userStartTime) - new Date(a.userStartTime)
      );
      
      setLoginRecords(sortedRecords);
      setLoading(false);
    }, 1000); // 1초 지연
  };
  
  // 컴포넌트가 처음 렌더링될 때 더미 데이터 로드
  useEffect(() => {
    fetchLoginRecords();
  }, []);

  const handleSearch = (e) => {
    // Enter 키를 눌렀을 때도 검색 실행
    if (e.key === 'Enter') {
      fetchLoginRecords();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>접속 정보 조회</h1>
      <p>사용자들의 접속 정보를 조회하는 페이지입니다.</p>

      {/* 검색 조건 영역 */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h3>🔍 검색 조건</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={searchField} 
            onChange={(e) => setSearchField(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="userId">ID</option>
            <option value="userNick">닉네임</option>
          </select>
          <input
            type="text"
            placeholder={`검색할 ${searchField === 'userId' ? 'ID' : '닉네임'}을 입력하세요`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearch} // Enter 키 입력 감지
            style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={fetchLoginRecords} // 버튼 클릭 시 검색 실행
            style={{ padding: '8px 15px', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            검색
          </button>
        </div>
        <small style={{ marginTop: '10px', display: 'block', color: '#666' }}>
          검색창을 비우고 검색하면 전체 내역을 조회합니다.
        </small>
      </div>

      {/* 로딩 메시지 */}
      {loading && <p style={{ textAlign: 'center', color: '#007bff' }}>데이터를 불러오는 중입니다...</p>}
      
      {/* 조회 페이지 표 */}
      {!loading && (
        <>
          {loginRecords.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#555' }}>조회된 접속 정보가 없습니다.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th style={tableHeaderStyle}>ID (userId)</th>
                    <th style={tableHeaderStyle}>닉네임 (userNick)</th>
                    <th style={tableHeaderStyle}>접속 시작 시간</th>
                    <th style={tableHeaderStyle}>접속 종료 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {loginRecords.map((record, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tableCellStyle}>{record.userId}</td>
                      <td style={tableCellStyle}>{record.userNick}</td>
                      <td style={tableCellStyle}>{new Date(record.userStartTime).toLocaleString()}</td>
                      <td style={tableCellStyle}>
                        {record.userEndTime ? new Date(record.userEndTime).toLocaleString() : '접속 중'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 테이블 스타일 정의 (인라인 스타일 대신 CSS 모듈 사용을 권장합니다)
const tableHeaderStyle = {
  padding: '12px 15px',
  border: '1px solid #ddd',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tableCellStyle = {
  padding: '10px 15px',
  border: '1px solid #ddd',
  textAlign: 'left',
};

export default LoginRecordView;