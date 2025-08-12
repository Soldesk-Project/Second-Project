import React, { useContext, useEffect, useState } from 'react';
import styles from '../../css/adminPage/UserRestrict.module.css';
import { WebSocketContext } from '../../util/WebSocketProvider';

const PAGE_SIZE = 8;

const UserRestrict = () => {
  const sockets = useContext(WebSocketContext);
  const token = localStorage.getItem('token');
  // 검색 조건을 위한 상태
  const [searchConditions, setSearchConditions] = useState({
    searchType: 'userId',
    searchValue: '',
  });

  // 사용자 목록, 로딩 상태, 에러 상태를 위한 상태
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalReports] = useState(0);

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

  useEffect(()=>{
    handleSearch();
  },[page])
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
      const apiUrl = `/admin/users/search?searchType=${encodedSearchType}&searchValue=${encodedSearchValue}&page=${page}&size=${PAGE_SIZE}`;
        
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();

      if (Array.isArray(data.items)) {
        setUsers(data.items);
        setTotalReports(data.totalCount);
      } else {
        console.error("Fetched data is not an array:", data.items);
        setError("서버에서 예상치 못한 형식의 데이터를 반환했습니다.");
        setUsers([]);
      }
        
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`사용자 정보를 가져오는 데 실패했습니다.`);
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

    const usersToBan = [];
    const userMap = new Map(users.map(user => [user.user_no, user]));

    // 먼저, 이미 금지된 사용자들을 걸러내고 메시지를 띄웁니다.
    for (const userNo of selectedUserNos) {
        const user = userMap.get(userNo);
        if (user) {
            if (user.ischatbanned === 1) {
                alert(`${user.user_nick} 회원은 이미 채팅 금지가 적용되었습니다.`);
            } else {
                usersToBan.push(userNo); // 아직 금지되지 않은 사용자만 목록에 추가
            }
        }
    }

    if (usersToBan.length === 0) {
        // 모든 선택된 사용자가 이미 금지되었거나, 선택된 사용자가 없는 경우
        setSelectedUserNos(new Set()); // 선택된 항목 초기화
        return; // 백엔드 요청을 보내지 않고 함수 종료
    }

    const isConfirmed = window.confirm(`선택된 회원 중 ${usersToBan.length}명에 대해 채팅금지를 적용하시겠습니까?`);

    if (isConfirmed) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/admin/users/ban-chat', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userNos: usersToBan }), // 실제 금지할 사용자만 보냅니다.
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        alert(result.message || '채팅금지가 성공적으로 적용되었습니다.');

        await handleSearch(); // 변경된 상태를 반영하기 위해 다시 검색
        setSelectedUserNos(new Set()); // 선택된 항목 초기화

      } catch (err) {
        console.error("Error applying chat ban:", err);
        setError(`채팅금지 적용에 실패했습니다. `);
      } finally {
        setLoading(false);
      }
    }
  };

  const getTotalPages = () => Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));



  // 접속 금지 버튼
  const handleApplyOnlineBan=async()=>{
    if (selectedUserNos.size === 0) {
      alert('접속금지를 적용할 사용자를 한 명 이상 선택해주세요.');
      return;
    }

    const usersToBan = [];
    const userMap = new Map(users.map(user => [user.user_no, user]));

    // 먼저, 이미 금지된 사용자들을 걸러내고 메시지를 띄웁니다.
    for (const userNo of selectedUserNos) {
        const user = userMap.get(userNo);
        if (user) {
            if (user.is_logged_in === 1) {
                alert(`${user.user_nick} 회원은 이미 채팅 금지가 적용되었습니다.`);
            } else {
                usersToBan.push(userNo); // 아직 금지되지 않은 사용자만 목록에 추가
            }
        }
    }

    if (usersToBan.length === 0) {
        // 모든 선택된 사용자가 이미 금지되었거나, 선택된 사용자가 없는 경우
        setSelectedUserNos(new Set()); // 선택된 항목 초기화
        return; // 백엔드 요청을 보내지 않고 함수 종료
    }

    const isConfirmed = window.confirm(`선택된 회원 중 ${usersToBan.length}명에 대해 접속금지를 적용하시겠습니까?`);

    if (isConfirmed) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/admin/users/ban-login', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userNos: usersToBan }), // 실제 금지할 사용자만 보냅니다.
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        alert(result.message || '접속금지가 성공적으로 적용되었습니다.');

        await handleSearch(); // 변경된 상태를 반영하기 위해 다시 검색
        setSelectedUserNos(new Set()); // 선택된 항목 초기화

      } catch (err) {
        console.error("Error applying chat ban:", err);
        setError(`접속금지 적용에 실패했습니다. `);
      } finally {
        setLoading(false);
      }
    }
  }

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

  useEffect(() => {
    const banSocket = sockets['ban'];
    if (!banSocket) return;

    banSocket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.warn("🟠 JSON 파싱 실패:", event.data);
        return;
      }

      switch (data.type) {
        
      }
    }
  })

  return (
    <div className={styles.userRestrictContainer}>
      <h1>유저 제재</h1>
      <hr/>
      {/* 검색 폼 */}
      <div className={styles.searchSection}>
        <div className={styles.searchControls}>
          <label htmlFor="searchType">검색 기준: </label>
          <select
            id="searchType"
            name="searchType"
            value={searchConditions.searchType}
            onChange={handleChange}
            className={styles.searchSelect}>
            <option value="userId">ID</option>
            <option value="userNick">별명</option>
            <option value="userRank">랭크</option>
          </select>
          <label htmlFor="searchValue">검색어: </label>
          <input
            type="text"
            id="searchValue"
            name="searchValue"
            value={searchConditions.searchValue}
            onChange={handleChange}
            placeholder={getPlaceholderText()}
            className={styles.searchInput}/>
          <button
            onClick={handleSearch}
            disabled={loading}
            className={styles.searchButton}>
            {loading ? '검색중' : '검색'}
          </button>
        </div>
      </div>

      <hr />
        
      {/* 로딩 및 에러 메시지 표시 */}
      {loading && <p className={styles.loadingMessage}>사용자 정보를 불러오는 중입니다...</p>}
      {error && <p className={styles.errorMessage}>오류: {error}</p>}

      {/* 검색 결과 표 조건부 렌더링 */}
      {!loading && !error && users.length > 0 ? (
        <div className={styles.searchResults}>
          <div className={styles.searchHeader}>
            <div>
              <h3>검색 결과</h3>
            </div>
            <div className={styles.banBtnWrapper}>
              {/* 채팅금지 적용 버튼 */}
              <button
                onClick={handleApplyChatBan}
                disabled={loading || selectedUserNos.size === 0}
                className={styles.applyBanButton}>
                {loading ? '적용중...' : `채팅금지 적용 (${selectedUserNos.size}명)`}
              </button>
              {/* 접속 금지 버튼 */}
              <button
                onClick={handleApplyOnlineBan}
                disabled={loading || selectedUserNos.size === 0}
                className={styles.applyBanButton}>
                {loading ? '적용중...' : `접속금지 적용 (${selectedUserNos.size}명)`}
              </button>
            </div>
          </div>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>별명</th>
                <th>이메일</th>
                <th>가입일</th>
                <th>계정 상태</th>
                <th>선택</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_no}>
                  <td className={styles.userId}>{user.user_id}</td>
                  <td>{user.user_nick} <span className={styles.report_count}>[ {user.report_count} ]</span></td>
                  <td>{user.user_email}</td>
                  <td>
                    {user.user_date ? (() => {
                      const timestamp = user.user_date;
                      const dateObject = new Date(timestamp);
                      return dateObject.toString() !== 'Invalid Date'
                        ? dateObject.toLocaleDateString('ko-KR')
                        : 'N/A (날짜 변환 오류)';
                    })() : 'N/A'}
                  </td>
                  <td className={styles.chatBanStatus}>
                    {user.is_logged_in === 1 ? '접속금지': (user.ischatbanned ===1?'채팅금지':'정상')}

                    {(user.ischatbanned === 1 || user.is_logged_in === 1) && user.banned_timestamp && (
                      <span className={styles.banDuration}>
                        (~ {new Date(new Date(user.banned_timestamp).getTime() + 72 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}까지)
                      </span>
                    )}
                  </td>
                  <td className={styles.checkboxCol}>
                    <input
                      type='checkbox'
                      checked={selectedUserNos.has(user.user_no)}
                      onChange={() => handleCheckboxChange(user.user_no)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.listFooter}>
            <div className={styles.pagination}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                이전
              </button>
              <span>{page} / {getTotalPages()}</span>
              <button
                onClick={() => setPage((p) => Math.min(getTotalPages(), p + 1))}
                disabled={page === getTotalPages()}>
                다음
              </button>
            </div>
          </div>
        </div>
      ) : (
        !loading && !error && <p className={styles.noResultsMessage}>검색 결과가 없습니다. 검색 조건을 선택하고 '검색' 버튼을 눌러주세요.</p>
      )}
    </div>
  );
};

export default UserRestrict;