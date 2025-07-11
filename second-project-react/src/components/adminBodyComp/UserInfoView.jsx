import React, { useState } from 'react';

const UserInfoView = () => {
  // 검색 조건을 위한 상태
  const [searchConditions, setSearchConditions] = useState({
    userNo: '',
    userId: '',
    userNick: '',
    userRank: '',
  });

  // 검색 결과를 저장할 유저 데이터 배열
  const [users, setUsers] = useState([]);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchConditions((prevConditions) => ({
      ...prevConditions,
      [name]: value,
    }));
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    // 실제 API 호출 또는 더미 데이터 검색 로직이 여기에 들어갑니다.
    // 여기서는 예시를 위해 더미 데이터를 사용합니다.
    const dummyData = [
      { userNo: '1001', userId: 'userA', userNick: '고양이집사', userEmail: 'a@example.com', userDate: '2023-01-15', userPoint: 1200, userRank: '골드' },
      { userNo: '1002', userId: 'userB', userNick: '개발자킴', userEmail: 'b@example.com', userDate: '2022-11-20', userPoint: 800, userRank: '실버' },
      { userNo: '1003', userId: 'userC', userNick: '독서광', userEmail: 'c@example.com', userDate: '2024-03-01', userPoint: 1500, userRank: '플래티넘' },
      { userNo: '1004', userId: 'userA', userNick: '강아지사랑', userEmail: 'd@example.com', userDate: '2023-05-10', userPoint: 950, userRank: '실버' },
      { userNo: '1005', userId: 'userD', userNick: '여행가', userEmail: 'e@example.com', userDate: '2022-07-01', userPoint: 2000, userRank: '다이아몬드' },
    ];

    // 검색 조건에 따라 더미 데이터를 필터링하는 간단한 로직 (실제로는 서버 API 호출)
    const filteredUsers = dummyData.filter(user => {
      return (searchConditions.userNo ? user.userNo.includes(searchConditions.userNo) : true) &&
             (searchConditions.userId ? user.userId.includes(searchConditions.userId) : true) &&
             (searchConditions.userNick ? user.userNick.includes(searchConditions.userNick) : true) &&
             (searchConditions.userRank ? user.userRank.includes(searchConditions.userRank) : true);
    });

    setUsers(filteredUsers);
  };

  return (
    <div>
      <h2>유저 정보 조회</h2>
      <p>유저 정보를 조회하는 페이지입니다.</p>

      {/* 검색 폼 */}
      <div>
        <h3>검색 조건</h3>
        <div>
          <label htmlFor="userNo">회원번호: </label>
          <input type="text" id="userNo" name="userNo" value={searchConditions.userNo} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="userId">ID: </label>
          <input type="text" id="userId" name="userId" value={searchConditions.userId} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="userNick">별명: </label>
          <input type="text" id="userNick" name="userNick" value={searchConditions.userNick} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="userRank">랭크: </label>
          <input type="text" id="userRank" name="userRank" value={searchConditions.userRank} onChange={handleChange} />
        </div>
        <button onClick={handleSearch}>검색</button>
      </div>

      <hr />

      {/* 검색 결과 표 */}
      {users.length > 0 ? (
        <div>
          <h3>검색 결과</h3>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px' }}>회원번호(userNo)</th>
                <th style={{ padding: '8px' }}>ID(userId)</th>
                <th style={{ padding: '8px' }}>별명(userNick)</th>
                <th style={{ padding: '8px' }}>이메일(userEmail)</th>
                <th style={{ padding: '8px' }}>가입일(userDate)</th>
                <th style={{ padding: '8px' }}>포인트(userPoint)</th>
                <th style={{ padding: '8px' }}>랭크(userRank)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userNo}>
                  <td style={{ padding: '8px' }}>{user.userNo}</td>
                  <td style={{ padding: '8px' }}>{user.userId}</td>
                  <td style={{ padding: '8px' }}>{user.userNick}</td>
                  <td style={{ padding: '8px' }}>{user.userEmail}</td>
                  <td style={{ padding: '8px' }}>{user.userDate}</td>
                  <td style={{ padding: '8px' }}>{user.userPoint}</td>
                  <td style={{ padding: '8px' }}>{user.userRank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>검색 결과가 없습니다. 검색 조건을 입력하고 '검색' 버튼을 눌러주세요.</p>
      )}
    </div>
  );
};

export default UserInfoView;