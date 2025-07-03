import axios from 'axios';
import React, { useEffect, useState } from 'react';
import styles from '../css/UserRanking.module.css';
import decoStyles from '../css/Decorations.module.css';
import TestModal from './TestModal';
import { useSelector } from 'react-redux';

const UserRanking = () => {

    const [userRankingList, setUserRankingList] = useState([]);
    const [itemList, setItemList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useSelector((state) => state.user);
    const user_no = user.user_no;

    const getUserRankingList = async () => {
        const resp = await axios.get('/user/ranking');
        if(resp.status === 200){
            const data = resp.data;
            
            setUserRankingList(data);
            setLoading(false);
            // console.log(data);   //------콘솔 같이 찍혀서 잠시 주석 처리--------------------------------
            
            
        }else{
            new Error('데이터 요청 실패..');
        }
    }

    const getitem = async () => {
        const resp = await axios.get('/user/item');
        if(resp.status === 200){
            const data = resp.data;
            
            setItemList(data);
            
        }else{
            new Error('데이터 요청 실패..');
        }
    }

    const sendItemNameToBackend = async (css_class_name,item_type) => {
        try {
            const resp = await axios.post('/user/item/select', { 
                css_class_name, 
                item_type,
                user_no
            });
            if (resp.status === 200) {
            console.log('아이템 전송 성공:', css_class_name);
            getUserRankingList();
            } else {
            console.error('아이템 전송 실패:', resp.status);
            }
        } catch (error) {
            console.error('아이템 전송 중 에러:', error);
        }
    };

    useEffect(() => {
        getUserRankingList();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            getitem();
        }
    }, [isModalOpen]);

    if(loading) return <div>로딩중</div>;
    console.log(userRankingList);
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => setIsModalOpen(true)}>테스트</button>유저 랭킹
            </div>
            <div className={styles.userList}>
                {
                    userRankingList.map(user => (
                        <div
                        key={user.user_no}
                        className={`${styles.user} ${decoStyles[user.boundary_class_name]} ${decoStyles[user.background_class_name]}`}
                        >
                        <div className={decoStyles[user.title_class_name]}>
                            {user.user_nick}
                        </div>
                        </div>
                    ))
                }
                <TestModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="아이템 테스트"
                >
                    {
                        itemList.map(item => (
                            <div 
                                key={item.item_no} 
                                style={{ cursor: 'pointer', padding: '4px 0' }}
                                onClick={() => sendItemNameToBackend(item.css_class_name, item.item_type)} >
                                <div>
                                    {item.item_name}
                                </div>
                            </div>
                        ))
                    }
                </TestModal>
            </div>
        </div>
    );
};

export default UserRanking;