import React, { useContext, useEffect, useState } from 'react';
import InventoryModal from './modal/InventoryModal';
import { useDispatch, useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';
import styles from '../css/UserInfo.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';
import PreviewModal from './modal/PreviewModal';
import { WebSocketContext } from '../util/WebSocketProvider';
import { triggerRefreshRanking } from '../store/rankingSlice';

const TABS = ['테두리', '칭호', '글자색', '배경', '말풍선'];

const UserInfo = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [items, setItems]   = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.user);
    const { isTop10 } = useSelector((state) => state.ranking);
    const sockets = useContext(WebSocketContext);
    const socket = sockets['server'];
    
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
        if (!user.user_no) return;
        axios
        .get('/user/inventory/category', {
            params: {
            category: activeTab,
            user_no: user.user_no
            }
        })
        .then((res) => setItems(res.data))
        .catch(() => setItems([]));
    }, [activeTab, user.user_no]);
    
    const renderTier = () => {
        const rank = user.user_rank;
        if (rank > 800 && isTop10) return '챌린저';
        if (rank > 800) return '다이아몬드';
        if (rank > 400) return '플래티넘';
        if (rank > 200) return '골드';
        if (rank > 100) return '실버';
        return '브론즈';
    };

    const clickItem = async (item) => {
      try {
             const { status } = await axios.post('/user/item/select', {
                css_class_name : item.css_class_name,
                item_type : item.item_type,
                user_no : user.user_no
            });

            if (status === 200) {
                dispatch(triggerRefreshRanking());

                if (socket && socket.readyState === 1) {
                    socket.send(JSON.stringify({
                        action: 'updateStyle',
                        userNo: user.user_no
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
    }
  
    // WebSocket 메시지 핸들링
        useEffect(() => {
            if (!socket) return;
    
            const handleMessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'styleUpdated') {dispatch(triggerRefreshRanking()); }
            };
    
            socket.addEventListener('message', handleMessage);
    
            return () => { socket.removeEventListener('message', handleMessage); };
        }, [socket]);

  return (
    <div>
      <h1>유저 정보쪽</h1>
      <button style={openButtonStyle} onClick={() => setIsModalOpen(true)}>Inventory</button>

      <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div style={{textAlign: 'center'}}>닉네임 : {user.user_nick}</div>
        <div style={{textAlign: 'center'}}>티어 : {renderTier()}</div>
        <div style={{textAlign: 'center'}}>칭호 : {titleTextMap[user.title_class_name]}</div>
        <div style={{textAlign: 'center'}}>정답률 : </div>

        <div role="tablist" className={styles.subTabContainer}>
          <div className={styles.subTabLeft}>
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={[
                  styles.tabItem,
                  activeTab === tab && styles.activeTab
                ].filter(Boolean).join(' ')}
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
                    <div key={item.item_no} className={styles.card} onClick={() => setSelectedItem(item)}>
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
      {selectedItem && (<PreviewModal action={'UserInfo'} user={user} item={selectedItem} onClose={() => setSelectedItem(null)} on_click={() => clickItem(selectedItem)} />)}
    </div>
  );
};

export default UserInfo;