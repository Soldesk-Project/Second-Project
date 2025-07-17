import React, { useState } from 'react';

const UserInfoView = () => {
  // 검색 조건을 위한 상태
  const [searchConditions, setSearchConditions] = useState({
    searchType: 'userId',
    searchValue: '',
  });

  // 사용자 목록, 로딩 상태, 에러 상태를 위한 상태
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchConditions((prevConditions) => ({
      ...prevConditions,
      [name]: value,
    }));
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = async () => {
    // 검색 시작 시 로딩 상태 true, 에러 메시지 초기화
    setLoading(true);
    setError(null);

    try {
      // URL 인코딩 적용 (한글 검색어 등 문제 방지)
      const encodedSearchType = encodeURIComponent(searchConditions.searchType);
      const encodedSearchValue = encodeURIComponent(searchConditions.searchValue);
      const apiUrl = `/admin/users/search?searchType=${encodedSearchType}&searchValue=${encodedSearchValue}`;
      
      console.log("Fetching from:", apiUrl); // 백엔드 요청 URL 로그

      const response = await fetch(apiUrl);

      // HTTP 응답 상태 코드 확인 (200 OK가 아니면 에러 처리)
      if (!response.ok) {
        // 서버에서 보낸 에러 메시지를 포함하여 상세하게 출력
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // JSON 데이터 파싱
      const data = await response.json();
      console.log("⭐ RECEIVED DATA FROM BACKEND:", data); // 백엔드로부터 받은 데이터 로그

      // 데이터가 배열 형태인지 확인 후 상태 업데이트
      if (Array.isArray(data)) {
        setUsers(data);
        console.log("Users state updated with", data.length, "items."); // users 상태 업데이트 로그
      } else {
        // 배열이 아닌 예상치 못한 데이터 형식인 경우
        console.error("Fetched data is not an array:", data);
        setError("서버에서 예상치 못한 형식의 데이터를 반환했습니다.");
        setUsers([]); // 사용자 목록 초기화
      }
      
    } catch (err) {
      // 네트워크 오류 또는 JSON 파싱 오류 등 예외 처리
      console.error("Error fetching users:", err);
      // 사용자 친화적인 에러 메시지 설정
      setError(`사용자 정보를 가져오는 데 실패했습니다. ${err.message || '네트워크 문제일 수 있습니다.'}`);
      setUsers([]); // 에러 발생 시 사용자 목록 초기화
    } finally {
      setLoading(false); // 검색 완료 시 로딩 상태 false (성공/실패 무관)
    }
  };

  // 선택된 searchType에 따라 placeholder 텍스트를 반환하는 헬퍼 함수
  const getPlaceholderText = () => {
    switch (searchConditions.searchType) {
      case 'userId':
        return 'ID를 입력하세요';
      case 'userNick':
        return '별명을 입력하세요';
      case 'userRank':
        return '랭크를 입력하세요';
      default:
        return '검색어를 입력하세요';
    }
  };

  return (
    <div>
      <h2>유저 정보 조회</h2>
      <p>유저 정보를 조회하는 페이지입니다.</p>

      {/* 검색 폼 */}
      <div>
        <h3>검색 조건</h3>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="searchType" style={{ marginRight: '10px' }}>검색 기준: </label>
          <select
            id="searchType"
            name="searchType"
            value={searchConditions.searchType}
            onChange={handleChange}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="userId">ID</option>
            <option value="userNick">별명</option>
            <option value="userRank">랭크</option>
          </select>
          &nbsp;&nbsp;&nbsp;
          <label htmlFor="searchValue" style={{ marginRight: '10px' }}>검색어: </label>
          <input
            type="text"
            id="searchValue"
            name="searchValue"
            value={searchConditions.searchValue}
            onChange={handleChange}
            placeholder={getPlaceholderText()}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
          />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 20px',
              marginTop: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
            {loading ? '검색중' : '검색'} {/* 로딩 상태에 따라 버튼 텍스트 변경 */}
          </button>
        </div>
      </div>

      <hr />
      
      {/* 로딩 및 에러 메시지 표시 */}
      {loading && <p>사용자 정보를 불러오는 중입니다...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>오류: {error}</p>}

      {/* 검색 결과 표 조건부 렌더링 */}
      {/* 로딩 중이 아니고 에러도 없으며, 사용자 목록이 비어있지 않을 때만 표를 렌더링 */}
      {!loading && !error && users.length > 0 ? (
        <div>
          <h3>검색 결과</h3>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px' }}>회원번호</th>
                <th style={{ padding: '8px' }}>ID</th>
                <th style={{ padding: '8px' }}>별명</th>
                <th style={{ padding: '8px' }}>이메일</th>
                <th style={{ padding: '8px' }}>가입일</th>
                <th style={{ padding: '8px' }}>포인트</th>
                <th style={{ padding: '8px' }}>랭크</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userNo} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_no}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_nick}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_email}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {user.user_date ? (() => {
                      const timestamp = user.user_date;
                      const dateObject = new Date(timestamp);

                      // 유효한 Date 객체인지 확인 후 렌더링
                      return dateObject.toString() !== 'Invalid Date'
                        ? dateObject.toLocaleDateString('ko-KR')
                        : 'N/A (날짜 변환 오류)';
                      })() : 'N/A'} {/* user.user_date가 null 또는 undefined인 경우 */}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_point}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // 로딩 중이 아니고 에러도 없으며, 사용자 목록이 비어있을 때 (검색 결과 없음) 메시지 표시
        !loading && !error && <p style={{ marginTop: '20px', color: '#555' }}>검색 결과가 없습니다. 검색 조건을 선택하고 '검색' 버튼을 눌러주세요.</p>
      )}
    </div>
  );
};

export default UserInfoView;