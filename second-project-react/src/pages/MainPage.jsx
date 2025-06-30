import React from 'react';
import Header from '../layout/Header';
import '../css/MainPage.css';
import RoomList from '../components/RoomList';

const MainPage = () => {
  return (
    <div className="main-container"> {/* 공간 부터 나눴음*/}

      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className='top-nav'><Header/></div>

      <div className="main-body">

        <div className='main-left'>

          <div className='main-content'>

            {/* 좌측 유저 정보, 최근 플레이 목록 */}
            <div className='user-info'>유저 정보쪽</div>

            {/* 중앙 영역 (필터, 방 리스트 등) */}
            <div className='lobby-center'><RoomList/></div>

          </div>

          {/* 하단 채팅창 */}
          <div className='chat-box'>채팅창</div>

        </div>
        {/* 우측 유저 목록/랭킹 목록 */}
        <div className='main-right'>
          {/* 랭킹 목록 */}
          <div className='user-ranking'>유저 랭킹</div>
          {/* 우측 친구 목록 */}
          <div className='friend-list'>친구 목록</div>
        </div>

      </div>

    </div>
  );
};

export default MainPage;