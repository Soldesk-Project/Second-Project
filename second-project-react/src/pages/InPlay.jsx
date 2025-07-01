import React from 'react';
import Header from '../layout/Header';
import Chatbox from '../layout/Chatbox';
import Test from '../components/Test';
import styles from '../css/Inplay.module.css';

const InPlay = () => {
  return (
        <div className={styles.container}> {/* 공간 부터 나눴음*/}

      {/* 상단 바 (로고 + 메뉴 + 검색) */}
      <div className={styles.top_nav}><Header/></div>

      <div className={styles.body}>

        <div className={styles.body_left}>

          <div className={styles.solving}>
            {/* 중앙 영역 (필터, 방 리스트 등) */}
            <div className={styles.problem}><Test/></div>

          </div>

          {/* 하단 채팅창 */}
          <div className={styles.chat_box}><Chatbox/></div>

        </div>
        {/* 우측 랭킹 목록/ 유저 목록 */}
        <div className={styles.body_right}>
          <div className={styles.game_join_userList}>
            게임 참여 유저 목록
          </div>
        </div>

      </div>

    </div>
    // <div className={styles.main_container}> {/* 공간 부터 나눴음*/}

    //   {/* 상단 바 (로고 + 메뉴 + 검색) */}
    //   <div className={styles.top_nav}><Header/></div>

    //   <div className={styles.main_body}>

    //     <div className={styles.main_left}>

    //       <div className={styles.solving}>

    //         {/* 좌측 유저 정보, 최근 플레이 목록 */}
    //         <div className={styles.problem}><Test/></div>
            
    //       </div>

    //       {/* 하단 채팅창 */}
    //       <div className={styles.chat_box}><Chatbox/></div>

    //     </div>
    //     {/* 우측 유저 목록/랭킹 목록 */}
    //     <div className={styles.main_right}>
    //       <div className={styles.game_join_userList}>
    //         게임 참여 유저 목록
    //       </div>
    //     </div>

    //   </div>
    // </div>
    
  );
};

export default InPlay;