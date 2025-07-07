import React from 'react';
import Header from '../layout/Header';
import styles from '../css/MainPage.module.css';
import RoomList from '../components/RoomList';
import ServerUserList from '../components/ServerUserList';
import UserRanking from '../components/UserRanking';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loadUserFromStorage } from '../store/userSlice';
import ServerChatbox from '../layout/ServerChatbox';

const MainPage = () => {
  const dispatch = useDispatch();
  const { user, server } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, []);

  if (!user || !server) {
    return <div>로딩 중...</div>;
  }
  
  return (
    <div className={styles.container}> {/* 공간 부터 나눴음*/}

      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={styles.top_nav}><Header/></div>

      <div className={styles.body}>

        <div className={styles.body_left}>

          <div className={styles.body_content}>

            {/* 좌측 유저 정보, 최근 플레이 목록 */}
            <div className={styles.user_info}>
              유저 정보쪽
              <h1> 컬러 안정했어여... 고뇌 중</h1>
              </div>

            {/* 중앙 영역 (필터, 방 리스트 등) */}
            <div className={styles.lobby_center}><RoomList/></div>

          </div>

          {/* 하단 채팅창 */}
          <div className={styles.chat_box}><ServerChatbox/></div>

        </div>
        {/* 우측 랭킹 목록/ 유저 목록 */}
        <div className={styles.body_right}>
          {/* 랭킹 목록 */}
          <div className={styles.user_ranking}><UserRanking/></div>
          {/* 유저 목록 */}
          <div className={styles.user_list}><ServerUserList server={server} state={user}/></div>
        </div>

      </div>

    </div>
  );
};

export default MainPage;