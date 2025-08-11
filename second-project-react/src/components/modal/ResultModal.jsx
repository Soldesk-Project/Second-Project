import React, { useContext } from 'react';
import styles from '../../css/ResultModal.module.css';
import { WebSocketContext } from '../../util/WebSocketProvider';
import { useNavigate } from 'react-router-dom';

const ResultModal = ({ users, setResult, gameMode, roomNo, userNick, server, questionListLength }) => {
  const sockets = useContext(WebSocketContext);
  const nav = useNavigate();

  const close = () => {
    const socket = sockets.current['room'];
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        action: 'leaveRoom',
        roomNo: roomNo,
        gameMode: gameMode,
        userNick: userNick
      }));
    }
    nav('/main/' + server);
    setResult(false);
  };

  return (
    <div className={styles.overlay}> {/* 🔑 오버레이 추가 */}
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
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
                  <td>{score ? `${score/questionListLength*100}%` : '0'}</td>
                  <td>+{point}</td>
                  {gameMode === 'rank' && <td>{rankPoint ?? '-'}</td>}
                </tr>
              ))
            ) : (
              <tr></tr>
            )}
          </tbody>
        </table>
        <div className={styles.modalClose}>
          <button onClick={close} className={styles.modalCloseBtn}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
