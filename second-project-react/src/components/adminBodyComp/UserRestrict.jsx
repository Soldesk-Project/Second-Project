import React, { useState } from 'react';

const UserRestrict = () => {
  // 검색 조건을 위한 상태
  const [searchConditions, setSearchConditions] = useState({
    searchType: 'userId',
    searchValue: '',
  });

  // 사용자 목록, 로딩 상태, 에러 상태를 위한 상태
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 체크박스 선택된 사용자 ID 목록
  const [selectedUserNos, setSelectedUserNos] = useState(new Set());

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
    setLoading(true);
    setError(null);
    setUsers([]); // 검색 전 사용자 목록 초기화
    setSelectedUserNos(new Set()); // 검색 전 선택된 사용자 초기화

    try {
      const encodedSearchType = encodeURIComponent(searchConditions.searchType);
      const encodedSearchValue = encodeURIComponent(searchConditions.searchValue);
      // ischatbanned 컬럼도 백엔드에서 함께 가져오도록 API 수정 필요
      const apiUrl = `/admin/users/search?searchType=${encodedSearchType}&searchValue=${encodedSearchValue}`;
        
      console.log("Fetching from:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("⭐ RECEIVED DATA FROM BACKEND:", data);

      if (Array.isArray(data)) {
        setUsers(data);
        console.log("Users state updated with", data.length, "items.");
      } else {
        console.error("Fetched data is not an array:", data);
        setError("서버에서 예상치 못한 형식의 데이터를 반환했습니다.");
        setUsers([]);
      }
        
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`사용자 정보를 가져오는 데 실패했습니다. ${err.message || '네트워크 문제일 수 있습니다.'}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  //체크박스 변경 핸들러
  const handleCheckboxChange = (userNo) => {
    setSelectedUserNos((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(userNo)) {
        newSelected.delete(userNo);
      } else {
        newSelected.add(userNo);
      }
      return newSelected;
    });
  };

  //'채팅금지 적용' 버튼 클릭 핸들러
  const handleApplyChatBan = async () => {
    if (selectedUserNos.size === 0) {
      alert('채팅금지를 적용할 사용자를 한 명 이상 선택해주세요.');
      return;
    }

    // confirm 대화 상자를 사용하여 사용자에게 확인 요청
    const isConfirmed = window.confirm('정말 선택된 회원에 대한 채팅금지를 적용하시겠습니까?');

    if (isConfirmed) {
      // 로딩 상태 설정
      setLoading(true);
      setError(null);

      try {
        // 선택된 userNo 배열로 변환
        const userNosToBan = Array.from(selectedUserNos);
        console.log("Applying chat ban to:", userNosToBan);

        const response = await fetch('/admin/users/ban-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userNos: userNosToBan }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log("Chat ban application result:", result);
        alert(result.message || '채팅금지가 성공적으로 적용되었습니다.');

        await handleSearch(); // 변경된 상태를 반영하기 위해 다시 검색
        setSelectedUserNos(new Set()); // 선택된 항목 초기화

      } catch (err) {
        console.error("Error applying chat ban:", err);
        setError(`채팅금지 적용에 실패했습니다. ${err.message || '네트워크 문제일 수 있습니다.'}`);
      } finally {
        setLoading(false);
      }
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
      <h1>유저 제재</h1>
      <hr/>
      {/* 검색 폼 */}
      <div>
        <h3>제재 현황/대상 검색</h3>
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
            {loading ? '검색중' : '검색'}
          </button>
        </div>
      </div>

      <hr />
        
      {/* 로딩 및 에러 메시지 표시 */}
      {loading && <p>사용자 정보를 불러오는 중입니다...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>오류: {error}</p>}

      {/* 검색 결과 표 조건부 렌더링 */}
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
                <th style={{ padding: '8px' }}>채팅금지 여부</th>
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
                      return dateObject.toString() !== 'Invalid Date'
                        ? dateObject.toLocaleDateString('ko-KR')
                        : 'N/A (날짜 변환 오류)';
                    })() : 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_point}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.user_rank}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {user.ischatbanned === 1 ? '금지' : '정상'}
                    {user.ischatbanned === 1 && user.banned_timestamp && (
                      <span style={{ fontSize: '0.8em', color: '#888', display: 'block' }}>
                        (~ {new Date(new Date(user.banned_timestamp).getTime() + 72 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}까지)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserNos.has(user.userNo)}
                      onChange={() => handleCheckboxChange(user.userNo)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/*채팅금지 적용 버튼 */}
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              onClick={handleApplyChatBan}
              disabled={loading || selectedUserNos.size === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}>
              {loading ? '적용중...' : `채팅금지 적용 (${selectedUserNos.size}명)`}
            </button>
          </div>
        </div>
      ) : (
        !loading && !error && <p style={{ marginTop: '20px', color: '#555' }}>검색 결과가 없습니다. 검색 조건을 선택하고 '검색' 버튼을 눌러주세요.</p>
      )}
    </div>
  );
};

export default UserRestrict;