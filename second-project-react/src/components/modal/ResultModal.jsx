import React from 'react';
import styles from '../../css/ResultModal.module.css';

// const getRankedUsers = (users) => {
//   const sorted = [...users].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
//   let rank = 0;
//   let lastScore = null;
//   let realRank = 0;

//   const pointsMap = { 1: 40, 2: 30, 3: 20, 4: 10 };
//   return sorted.map((user, idx) => {
//     realRank++;
//     if (user.score !== lastScore) {
//       rank = realRank;
//       lastScore = user.score;
//     }
//     return {
//       ...user,
//       rank,
//       point: pointsMap[rank] ?? 10,
//     };
//   });
// };

const ResultModal = ({users, setResult, gameMode}) => {
  // const rankedUsers = getRankedUsers(users);

  console.log(gameMode);
  console.log(users);
  console.log(setResult);
  
  const close=()=>{
    setResult(false);
  }
  return (
    <div className={styles.modalContainer}>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>등수</th>
            <th>닉네임</th>
            <th>점수</th>
            <th>정답율</th>
            <th>포인트</th>
            {gameMode === 'rank' && <th>랭크점수</th>}
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map(({ userNick, userNo, isOwner, score, rank, point, rankPoint }) => (                
              <tr key={userNo}>
                <td>{isOwner ? '[방장]':'[유저]'}</td>
                <td>{rank}</td>
                <td>{userNick}</td>
                <td>{score ?? 0}</td>
                <td>{score ? `${score*5}%` : '0'}</td>
                <td>+{point}</td>
                {gameMode === 'rank' && <td>{rankPoint ?? '-'}</td>}
              </tr>
            ))
          ) : (
            <p>현재 접속 유저가 없습니다.</p>
          )}
        </tbody>
      </table>
      <div className={styles.modalClose}>
        <button onClick={close} className={styles.modalCloseBtn}>확인</button>
      </div>
    </div>
  );
};

export default ResultModal;