import React, { useContext, useState } from 'react';
import { WebSocketContext } from '../../util/WebSocketProvider';
import styles from '../../css/FilterModal.module.css';

const FilterModal = ({setFilterModal, server}) => {
  const [category, setCategory] = useState('all');
  const [isPrivate, setIsPrivate] = useState('all');

  const sockets = useContext(WebSocketContext);

  const closeModal = () => {
     setFilterModal(false);
  };

  const handleSearchRoom=()=>{
    console.log('category : '+category);
    console.log('isPrivate : '+isPrivate);
    
    const socket = sockets['room'];
    if (socket && socket.readyState === 1) {
        console.log('소켓요청');
        socket.send(JSON.stringify({
          action: "filterRoomList",
          server: server,
          category: category,
          is_private: isPrivate
        }));
    } else {
      alert("웹소켓 연결이 준비되지 않았습니다 -- filterRoomList");
    }
    closeModal();
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <table>
          <tbody>
            <tr>
              <td>카테고리</td>
              <td>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="all">전체</option>
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
              <td>공개 여부</td>
              <td>
                <select onChange={(e)=>setIsPrivate(e.target.value)}>
                  <option value="all">전체</option>
                  <option value="N">공개</option>
                  <option value="Y">비공개</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className={styles.searchBtn}>
        <button className={styles.close} onClick={closeModal}>취소</button>
        <button className={styles.search} onClick={handleSearchRoom}>검색하기</button>
      </div>
    </div>
  );
};

export default FilterModal;