import React, { useState } from 'react';
import styles from '../../css/ModalBasic.module.css';

const ModalBasic = ({ setModalOpen, socket, isWsOpen, onCategorySelect }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('random');
  const [mode, setMode] = useState('normal');
  const [limit, setLimit] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const closeModal = () => {
    setModalOpen(false);
  };

  const handlePrivacyChange = (e) => {
    setIsPrivate(e.target.value === 'private');
  };

  const handleCreateRoom = async () => {
    const regex = /^\d{4}$/;

    if (!isWsOpen) {  // 연결 상태 확인
      alert("웹소켓 연결 대기 중...");
      return;
    }
    if (isPrivate && password.trim() === '') {
      alert('비공개 방은 비밀번호를 입력해주세요.');
      return;
    }
    if (isPrivate && !regex.test(password)) {
      alert('비밀번호는 숫자 4자리만 입력 가능합니다.')
      return;
    }

    const roomData = {
      action: "createRoom",
      title,
      category,
      game_mode : mode,
      is_private : isPrivate ? 'Y' : 'N',
      limit : limit,
      pwd : isPrivate ? password : null
    };

    // ✅ 선택한 카테고리를 상위 컴포넌트에 전달
    if (typeof onCategorySelect === 'function') {
      onCategorySelect(category);
    }
    
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify(roomData));
      
      setModalOpen(false);
      
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다.--createRoom");
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.close} onClick={closeModal}>X</button>
      <table>
        <tbody>
          <tr>
            <td>방 제목</td>
            <td><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></td>
          </tr>
          <tr>
            <td>카테고리</td>
            <td>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="random">랜덤</option>
                <option value="cpe">정보처리기사</option>
                <option value="cpei">정보처리산업기사</option>
                <option value="cpet">정보처리기능사</option>
                <option value="lm1">리눅스마스터 1급</option>
                <option value="lm2">리눅스마스터 2급</option>
                <option value="icti">정보통신산업기사</option>
                <option value="ict">정보통신기사</option>
                <option value="sec">정보보안기사</option>
                <option value="net1">네트워크관리사 1급</option>
                <option value="net2">네트워크관리사 2급</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>모드</td>
            <td>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="normal">일반</option>
                {/* <option value="rank">랭크</option> */}
              </select>
            </td>
          </tr>
          <tr>
            <td>공개 여부</td>
            <td>
              <select onChange={handlePrivacyChange}>
                <option value="public">공개</option>
                <option value="private">비공개</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>인원 제한</td>
            <td>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                {/* {[2, 4, 6, 8, 10].map(num => ( */}
                {[4].map(num => (
                  <option key={num} value={num}>{num}명</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <td>비밀번호</td>
            <td>
              {
                isPrivate?
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="숫자 4자리 입력"
                  disabled={!isPrivate}
                />:
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비공개 방일 경우 입력"
                disabled={!isPrivate}
                />
              } 
            </td>
          </tr>
          <tr>
            <td colSpan="2" style={{ textAlign: 'center' }}>
              <button onClick={handleCreateRoom}>방 생성</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ModalBasic;
