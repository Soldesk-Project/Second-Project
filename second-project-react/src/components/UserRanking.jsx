import axios from 'axios';
import React, { useEffect, useState } from 'react';
import styles from '../css/UserRanking.module.css';

const UserRanking = () => {

    const [userRankingList, setUserRankingList] = useState([]);
    const [loading, setLoading] = useState(true);

    const getUserRankingList = async () => {
        // 2. 게시글 목록 데이터 받아오기
        const resp = await axios.get('/user/ranking');
        if(resp.status === 200){
            const data = resp.data;
            
            // 3. 게시글 목록 데이터 상태 값에 할당
            setUserRankingList(data);
            setLoading(false);
            // console.log(data);   //--------------------------------------
            
            
        }else{
            new Error('데이터 요청 실패..');
        }
    }

    useEffect(() => {
        getUserRankingList(); // 1. 게시글 목록 조회 함수 호출
    }, []);

    if(loading) return <div>로딩중</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>유저 랭킹</div>
            <div className={styles.userList}>
                {
                    // userRankingList.map(user => (
                    //         <div key={user.user_no} className={styles.user}>{user.user_nick}</div>
                    //     ))
                    userRankingList.map(user => (
                        <div
                        key={user.user_no}
                        className={`${styles.user} ${styles[user.boundary_class_name]} ${styles[user.background_class_name]}`}
                        >
                        <div className={styles[user.title_class_name]}>
                            {user.user_nick}
                        </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default UserRanking;