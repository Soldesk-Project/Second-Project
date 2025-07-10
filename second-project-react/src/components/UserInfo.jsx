import React, { useEffect, useState } from 'react';
import InventoryModal from './modal/InventoryModal';
import { useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';
import styles from '../css/ShopPage.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';

const UserInfo = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useSelector((state) => state.user);
    const { isTop10 } = useSelector((state) => state.ranking);
    const allTabs = ['테두리', '칭호', '글자색', '배경', '말풍선'];
    const [activeTab, setActiveTab] = useState(allTabs[0]);
    const [items, setItems]   = useState([]);
    
    const openButtonStyle = {
        padding: '8px 16px',
        backgroundColor: '#8367C7',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px'
    };

    useEffect(() => {
        // 포인트 충전 탭이 아니므로, activeTab만으로 fetch
        axios.get('/user/inventory/category', {
            params: {
                category: activeTab,
                user_no: user.user_no,
            },
        })
        .then(res => setItems(res.data))
        .catch(() => setItems([]));
    }, [activeTab]);
    
  return (
    <div>
      <h1>유저 정보쪽</h1>
      <button style={openButtonStyle} onClick={() => setIsModalOpen(true)}>Inventory</button>

      <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>닉네임 : {user.user_nick}</div>
        <div>
            티어 : {
                user.user_rank > 800 && isTop10
                ? '챌린저'
                : user.user_rank > 800
                ? '다이아몬드'
                : user.user_rank > 400
                ? '플래티넘'
                : user.user_rank > 200
                ? '골드'
                : user.user_rank > 100
                ? '실버'
                : '브론즈'
            }
        </div>
        <div>칭호 : {titleTextMap[user.title_class_name]}</div>
        <div>정답률 : </div>

        <div role="tablist" className={styles.subTabContainer}>
            <div className={styles.subTabLeft}>
                {allTabs.map(tab => (
                <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={[
                    styles.tabItem,                           // 기본 탭 스타일
                    activeTab === tab && styles.activeTab     // 선택된 탭 스타일
                    ]
                    .filter(Boolean)
                    .join(' ')}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </button>
                ))}
            </div>
        </div>
        <div className={styles.scrollArea}>
            <div className={styles.shopMaingrid}>
            <div className={styles.grid}>
                {items.length ? (
                items.map(item => (
                    <div key={item.item_no} className={styles.card}>
                    <div className={styles.itemCss}>
                        <div>
                            {item.item_type === 'title' && titleTextMap[item.css_class_name] && (
                                <span className={decoStyles[item.css_class_name]} style={{marginRight: '5px', fontWeight: 'bold'}}>
                                    [{titleTextMap[item.css_class_name]}]
                                </span>
                                )}
                            <span
                            className={
                                item.item_type !== 'title' ? decoStyles[item.css_class_name] : undefined
                            }
                            >
                            아이템
                            </span>
                        </div>
                    </div>
                    <div className={styles.itemName}>이름 : {item.item_name}</div>
                    </div>
                ))
                ) : (
                <div>상품이 없습니다.</div>
                )}
            </div>
            </div>
        </div>
      </InventoryModal>
    </div>
  );
};

export default UserInfo;