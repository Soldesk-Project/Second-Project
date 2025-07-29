import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import styles from '../css/UserRanking.module.css';
import decoStyles from '../css/Decorations.module.css';

import TestModal from './modal/TestModal';
import { WebSocketContext } from '../util/WebSocketProvider';
import { setIsTop10 } from '../store/rankingSlice';
import titleTextMap from '../js/Decorations';

const UserRanking = () => {
    const [userRankingList, setUserRankingList] = useState([]);
    const [itemList, setItemList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);
     const refreshRanking = useSelector((state) => state.ranking.refreshRanking);
     
    const sockets = useContext(WebSocketContext);
    const socket = sockets['server'];
    const user_no = user.user_no;

    // 유저 랭킹 리스트 불러오기
    const fetchUserRanking = async () => {
        try {
            const { data, status } = await axios.get('/user/ranking');
            if (status === 200) {
                setUserRankingList(data);
                setLoading(false);
            } else {
                throw new Error('유저 랭킹 요청 실패');
            }
        } catch (error) {
            console.error('유저 랭킹 로드 실패:', error);
        }
    };

    // 아이템 목록 불러오기
    const fetchItemList = async () => {
        try {
            const { data, status } = await axios.get('/user/item');
            if (status === 200) {
                setItemList(data);
            } else {
                throw new Error('아이템 요청 실패');
            }
        } catch (error) {
            console.error('아이템 목록 로드 실패:', error);
        }
    };

    // 아이템 선택 핸들러
    const handleItemSelect = async (css_class_name, item_type) => {
        try {
             const { status } = await axios.post('/user/item/select', {
                css_class_name,
                item_type,
                user_no
            });

            if (status === 200) {
                fetchUserRanking();

                if (socket && socket.readyState === 1) {
                    socket.send(JSON.stringify({
                        action: 'updateStyle',
                        userNo: user_no
                    }));
                } else {
                    console.warn('WebSocket이 아직 연결되지 않음');
                }

            } else {
                console.error('아이템 전송 실패:', status);
            }
        } catch (error) {
            console.error('아이템 전송 중 에러:', error);
        }
    };

    // 유저 랭킹 불러오기 (최초)
    useEffect(() => {
        fetchUserRanking();
    }, [refreshRanking, user.user_nick]);

    // 모달이 열릴 때 아이템 목록 불러오기
    useEffect(() => {
        if (isModalOpen) { fetchItemList(); }
    }, [isModalOpen]);

    // WebSocket 메시지 핸들링
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'styleUpdated') { fetchUserRanking(); }
        };

        socket.addEventListener('message', handleMessage);

        return () => { socket.removeEventListener('message', handleMessage); };
    }, [socket]);

    // Top10 여부 Redux 저장
    useEffect(() => {
        if (user_no && userRankingList.length > 0) {
        const isTop10 = userRankingList.slice(0, 10).some(u => u.user_no === user_no);
        dispatch(setIsTop10(isTop10));
        }
    }, [userRankingList, user_no, dispatch]);

    if (loading) return <div>로딩 중...</div>;
    
    // 아이템 그룹핑
    const groupedItems = itemList.reduce((acc, item) => {
        const { item_type } = item;
        if (!acc[item_type]) acc[item_type] = [];
        acc[item_type].push(item);
        return acc;
    }, {});
    
    const itemTypeLabel = {
        boundary: '테두리',
        title: '칭호',
        fontColor: '글자색',
        background: '배경',
        balloon: '말풍선',
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                유저 랭킹
            </div>

            <div className={styles.userList}>
                {userRankingList.map(({ user_no, user_nick, boundary_class_name, background_class_name, title_class_name, fontcolor_class_name }) => (
                    <div
                        key={user_no}
                        className={`${styles.user} ${decoStyles[boundary_class_name]} ${decoStyles[background_class_name]}`}
                    >
                        <div>
                            {title_class_name && titleTextMap[title_class_name] && (
                                <span className={decoStyles[title_class_name]} style={{marginRight: '5px', fontWeight: 'bold'}}>
                                    [{titleTextMap[title_class_name]}]
                                </span>
                                )}
                            <span className={decoStyles[fontcolor_class_name]}>
                                {user_nick}
                            </span>
                        </div>
                    </div>
                ))}

                <TestModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="아이템 테스트"
                    >
                    {Object.entries(groupedItems).map(([type, items]) => (
                        <div key={type} className={styles.itemGroup}>
                        <h5 style={{ marginTop: '10px' }}>{itemTypeLabel[type] || type}</h5>
                        {items.map(({ item_no, item_name, css_class_name, item_type }) => (
                            <div
                            key={item_no}
                            style={{ cursor: 'pointer', padding: '4px 0' }}
                            onClick={() => handleItemSelect(css_class_name, item_type)}
                            >
                            {item_name}
                            </div>
                        ))}
                        </div>
                    ))}
                    </TestModal>
            </div>
        </div>
    );
};

export default UserRanking;