import React from 'react';
import Header from '../layout/Header';
import AchievementsList from '../components/AchievementsList';
import UserRanking from '../components/UserRanking';
import ServerUserList from '../components/ServerUserList';
import { useLocation, useParams } from 'react-router-dom';
import styles from '../css/MainPage.module.css';
import ServerChatbox from '../layout/ServerChatbox';

const Achievements = () => {
  const { serverNo } = useParams(); // 서버 번호 URL에서 추출
  const { state } = useLocation();
  const userId = state?.userId;

  return (
    <div className={styles.container}> {/* 공간 부터 나눴음*/}

      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={styles.top_nav}><Header/></div>

      <div className={styles.body}>

        <div className={styles.body_left}>

          <div className={styles.body_content}>

            {/* 좌측 유저 정보, 최근 플레이 목록 */}
            <div className={styles.user_info}>유저 정보쪽</div>

            {/* 중앙 영역 (필터, 방 리스트 등) */}
            <div className={styles.lobby_center}><AchievementsList/></div>

          </div>

          {/* 하단 채팅창 */}
          <div className={styles.chat_box}><ServerChatbox/></div>

        </div>
        {/* 우측 랭킹 목록/ 유저 목록 */}
        <div className={styles.body_right}>
        {/* 랭킹 목록 */}
          <div className={styles.user_ranking}><UserRanking/></div>
          {/* 유저 목록 */}
          <div className={styles.user_list}><ServerUserList server={serverNo} userId={userId}/></div>
        </div>

      </div>

    </div>
  );
};

export default Achievements;