import React, { useState } from 'react';
import styles from '../css/ModalBasic.module.css';

const ModalBasic = ({ setModalOpen, socket, isWsOpen }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('engineer_information');
  const [mode, setMode] = useState('normal');
  const [limit, setLimit] = useState(2);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const closeModal = () => {
    setModalOpen(false);
  };

  const handlePrivacyChange = (e) => {
    setIsPrivate(e.target.value === 'private');
  };

  const handleCreateRoom = async () => {
    if (!isWsOpen) {  // 연결 상태 확인
      alert("웹소켓 연결 대기 중...");
      return;
    }
    if (isPrivate && password.trim() === '') {
      alert('비공개 방은 비밀번호를 입력해주세요.');
      return;
    }

    const roomData = {
      action: "createRoom",
      title,
      category,
      game_mode : mode,
      is_private : isPrivate ? 'Y' : 'N',
      limit,
      pwd : isPrivate ? password : null
    };
    
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
                <option value="engineer_information">정보처리기사</option>
                <option value="industrial_information">정보처리산업기사</option>
                <option value="function_information">정보처리기능사</option>
                <option value="linux_master_1">리눅스마스터1급</option>
                <option value="linux_master_2">리눅스마스터2급</option>
                <option value="industrial_communication">정보통신산업기사</option>
                <option value="engineer_communication">정보통신기사</option>
                <option value="security_engineer">정보보안기사</option>
                <option value="network_admin_1">네트워크관리사1급</option>
                <option value="network_admin_2">네트워크관리사2급</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>모드</td>
            <td>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="normal">일반</option>
                <option value="rank">랭크</option>
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
                {[2, 4, 6, 8, 10].map(num => (
                  <option key={num} value={num}>{num}명</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <td>비밀번호</td>
            <td>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비공개 방일 경우 입력"
                disabled={!isPrivate}
              />
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
