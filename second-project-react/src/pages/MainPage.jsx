import React, { useState } from 'react';
import Header from '../layout/Header';
import styles from '../css/MainPage.module.css';
import RoomList from '../components/RoomList';
import ServerUserList from '../components/ServerUserList';
import UserRanking from '../components/UserRanking';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loadUserFromStorage } from '../store/userSlice';
import { fetchUserItems, setShopItems } from '../store/shopSlice';
import ServerChatbox from '../components/chatbox/ServerChatbox';
import UserInfo from '../components/UserInfo';
import ItemList from '../components/ItemList';
import AchievementsList from '../components/AchievementsList';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const MainPage = () => {
  const dispatch = useDispatch();
  const { user, server } = useSelector((state) => state.user);
  const [currentPage, setCurrentPage] = useState('room');
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page');
  const [userRankingList, setUserRankingList] = useState([]);

  // 쿼리스트링 만들기
  const cats = ['테두리','칭호','글자색','명함','말풍선', '유니크'];
  const queryString = cats.map(cat => `category=${encodeURIComponent(cat)}`).join('&');

  useEffect(() => {
    dispatch(fetchUserItems());
    fetchUserRanking();
  }, []);
  
  const fetchUserRanking = async () => {
    try {
      const { data, status } = await axios.get('/api/user/ranking');
      if (status === 200) {
        setUserRankingList(data);
      }
    } catch (error) {
      console.error('유저 랭킹 로드 실패:', error);
    }
  };

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, []);

  if (!user || !server) {
    return <div>로딩 중...</div>;
  }

  const renderLobbyContent = () => {
    switch (page) {
      case 'itemBook':
        return <ItemList />;
      case 'achievements':
        return <AchievementsList />;
      default:
        return <RoomList/>;
    }
  };
  
  return (
    <div className={styles.container}> {/* 공간 부터 나눴음*/}

      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={styles.top_nav}><Header setCurrentPage={setCurrentPage} /></div>

      <div className={styles.body}>

        <div className={styles.body_left}>

          <div className={styles.body_content}>

            {/* 좌측 유저 정보, 최근 플레이 목록 */}
            <div className={styles.user_info}>
              {/* 유저 정보쪽 */}
              <UserInfo userRankingList={userRankingList} />
            </div>

            {/* 중앙 영역 (필터, 방 리스트 등) */}
            <div className={styles.lobby_center}>
              {renderLobbyContent()}
            </div>

          </div>

          {/* 하단 채팅창 */}
          <div className={styles.chat_box}><ServerChatbox/></div>

        </div>
        {/* 우측 랭킹 목록/ 유저 목록 */}
        <div className={styles.body_right}>
          {/* 랭킹 목록 */}
          <div className={styles.user_ranking}><UserRanking userRankingList={userRankingList}/></div>
          {/* 유저 목록 */}
          <div className={styles.user_list}><ServerUserList server={server} state={user}/></div>
        </div>

      </div>

    </div>
  );
};

export default MainPage;