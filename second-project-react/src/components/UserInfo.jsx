import React, { useCallback, useContext, useEffect, useState } from 'react';
import InventoryModal from './modal/InventoryModal';
import { useDispatch, useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';
import styles from '../css/UserInfo.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';
import PreviewModal from './modal/PreviewModal';
import { WebSocketContext } from '../util/WebSocketProvider';
import { triggerRefreshRanking } from '../store/rankingSlice';
import NickModal from './modal/NickModal';
import { setUser, fetchUserInfo } from '../store/userSlice';

const TABS = ['테두리', '칭호', '글자색', '배경', '말풍선'];

const UserInfo = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNickModalOpen, setIsNickModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [items, setItems]   = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.user);

    useEffect(() => {
      if (!user?.user_no) return;
      dispatch(fetchUserInfo(user.user_no));
    }, [user.user_no, dispatch]);

    const { isTop10 } = useSelector((state) => state.ranking);
    const sockets = useContext(WebSocketContext);
    const socket = sockets['server'];

    // --- 1) 프로필 상태
    const [profileSrc, setProfileSrc] = useState('/images/profile_default.png');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // 페이지 로드 시, 백엔드에서 유저 정보(프로필 포함) 가져오기
    useEffect(() => {
        if (!user?.user_profile_img) return;
        const raw = user.user_profile_img;
        const src = raw.startsWith('/images/')
            ? raw
            : `/images/${raw}`;
        setProfileSrc(src);
        }, [user.user_profile_img]);

    // --- 2) 프로필 변경 요청
    const PROFILE_OPTIONS = [
        '/images/profile_1.png',
        '/images/profile_2.png',
        '/images/profile_3.png',
        '/images/profile_4.png',
        '/images/profile_5.png',
        '/images/profile_6.png',
        '/images/profile_7.png',
        '/images/profile_8.png',
    ];

    const onSelectProfile = (src) => {
        axios.patch(`/user/${user.user_no}/profile-image`, { imageUrl: src })
        .then(() => {
            setProfileSrc(src);
            dispatch({ type: 'user/setProfileImage', payload: src });
            setIsProfileModalOpen(false);
        })
        .catch(err => {
            console.error('프로필 변경 실패', err);
            alert('서버 저장 중 오류가 발생했습니다.');
        });
    };
    
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
        params: { category: activeTab, user_no: user.user_no }
      })
      .then(({ data }) => {
        // console.log('Inventory raw data:', data);
        const withImg = data.map(item => {
        // 1) camelCase 프로퍼티부터 시도
        const raw =
          item.imageFileName ||
          'profile_default.png';

        // prefix 중복 제거
        const filename = raw.replace(/^\/images\//, '');

        const src = `/images/${filename}`;
        // console.log('Inventory imgUrl:', src);

          return { ...item, imgUrl: src };
        });
        setItems(withImg);
      })
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
        // console.log('🔔 clickItem 호출됨', item);
      try {
             const { status } = await axios.post('/user/item/select', {
                user_no : user.user_no,
                item_no : item.item_no,
                item_type : item.item_type
            });
            // console.log('🔔 POST /user/item/select 리턴 status=', status);

            if (status === 200) {
                // console.log('🔔 여기서 GET 날리기 직전');
                // 1) 랭킹 업데이트
                dispatch(triggerRefreshRanking());
                
                // 2) 최신 유저 정보 다시 가져오기
                const res = await axios.get(`/user/${user.user_no}`);
                
                // console.log('🔔 GET /user/4 리턴 data=', res.data);
                dispatch(setUser({
                user_no:               res.data.user_no,
                user_nick:             res.data.user_nick,
                user_profile_img:      res.data.user_profile_img,
                imageFileName:    res.data.imageFileName,
                boundaryItemNo:   res.data.boundaryItemNo,
                titleItemNo:      res.data.titleItemNo,
                fontcolorItemNo:  res.data.fontcolorItemNo,
                backgroundItemNo: res.data.backgroundItemNo,
                balloonItemNo:    res.data.balloonItemNo
                }));
                setSelectedItem(null);
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
                if (data.type === 'styleUpdated') {
                    dispatch(triggerRefreshRanking()); 
                    dispatch(fetchUserInfo(user.user_no)); }
            };
    
            socket.addEventListener('message', handleMessage);
    
            return () => { socket.removeEventListener('message', handleMessage); };
        }, [socket]);

    // 2) 사용자 통계 가져오기
        const [stats, setStats] = useState(null);
        useEffect(() => {
            if (!user.user_no) return;
            axios
            .get(`/user/accuracy`)
            .then(res => setStats(res.data))
            .catch(err => console.error(err));
        }, [user.user_no]);    

    // 2) 퍼센트 계산
    // --- 퍼센트 계산 (통계가 로딩되지 않았으면 0으로)
        const answerPercent = stats && stats.totalCount > 0
            ? Math.floor((stats.correctCount / stats.totalCount) * 100)
            : 0;

    const handleNicknameChange = (newNick) => {
        axios.patch(`/user/${user.user_no}/nickname`, { user_nick: newNick })
            .then(res => {
                const updatedUser = {
                    ...user,
                    user_nick: newNick,
                };
                dispatch(setUser(updatedUser));
                alert('닉네임이 변경되었습니다!');
            })
            .catch(err => {
                console.error('닉네임 변경 실패', err);
                alert('닉네임 변경 중 오류가 발생했습니다.');
            });
    };

    const handleChangePw = useCallback(async () => {
        if (loading) return;

        setLoading(true);
        try {
        const { data } = await axios.post('/api/findPw/sendResetLink', {
            user_id: user.user_id,
            user_email: user.user_email,
        });
        
        if (data.success) {
            alert(data.message);
        }
        } catch (error) {
         alert('비밀번호 변경 링크 요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [user.user_id, user.user_email, loading]);

  return (
    <div>
        <div className={styles.userInfo_Box}>
            <div className={styles.userInfo_Box_1}>
                <div className={styles.profileWrapper}>
                    <img 
                        src={profileSrc} 
                        alt='프로필'  
                        className={styles.profileImg}/>
                    <img
                        src='/images/switch.png'
                        alt='프로필변경'
                        className={styles.changeProfileIcon}
                        onClick={() => setIsProfileModalOpen(true)}
                    />
                    {user.imageFileName && (
                    <img
                        src={`/images/${user.imageFileName}`}
                        alt="테두리 이미지"
                        className={styles.frameOverlay}
                    />
                    )}
                </div>

            <div className={styles.userInfo_Name}>
                <p>{user.user_nick}</p>
                <p>{renderTier()}</p>
            </div>
            </div>

            {/* 프로필 선택 모달 */}
            {isProfileModalOpen && (
            <div
                className={styles.profileModalBackdrop}
                onClick={() => setIsProfileModalOpen(false)}
            >
                <div className={styles.profileModal} onClick={e=>e.stopPropagation()}>
                <h4>프로필 이미지 선택</h4>
                <div className={styles.profileOptionsGrid}>
                    {PROFILE_OPTIONS.map(src=>(
                    <img
                        key={src}
                        src={src}
                        alt='선택 이미지'
                        className={styles.profileOptionImg}
                        onClick={()=>onSelectProfile(src)}
                    />
                    ))}
                </div>
                <button
                    className={styles.closeProfileModal}
                    onClick={()=>setIsProfileModalOpen(false)}
                >
                    닫기
                </button>
                </div>
            </div>
            )}

            <div className={styles.bar_set}>
                {/* 정답률 바 */}
                <div className={styles.progressLine}>
                    <div
                    className={styles.progressFill}
                    style={{ width: `${answerPercent}%` }}
                    />
                </div>
                <div className={styles.label}>{answerPercent}% 정답률</div>
            </div>
        </div>
        <div className={styles.invenBtnWrapper}>
            <div className={styles.invenBtn}>
                <button style={openButtonStyle} onClick={() => setIsModalOpen(true)}>Inventory</button>
            </div>
            <div className={styles.invenBtn}>
                <button style={openButtonStyle} onClick={() => setIsNickModalOpen(true)}>닉네임 변경</button>
            </div>
        </div>
        <div className={styles.invenBtn}>
            <button style={openButtonStyle} onClick={handleChangePw} disabled={loading}>{loading ? '요청 중...' : '비밀번호 변경'}</button>
        </div>

        <NickModal isOpen={isNickModalOpen} onClose={() => setIsNickModalOpen(false)}  onSubmit={handleNicknameChange}/>

      <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
                        {/* title 타입은 텍스트 데코, 그 외엔 이미지 */}
                        {item.item_type === 'title' ? (
                        <span className={decoStyles[item.css_class_name]}>
                            [{titleTextMap[item.css_class_name]}]
                        </span>
                        ) : (
                        <img 
                            src={item.imgUrl}
                            alt={item.item_name}
                            className={styles.itemImage}
                        />
                        )}
                    </div>
                            {/* <span className={decoStyles[item.css_class_name]} style={{marginRight: '5px', fontWeight: 'bold'}}>
                                [{titleTextMap[item.css_class_name]}]
                            </span>
                            )}
                            <span
                            className={
                                item.item_type !== 'title' ? decoStyles[item.css_class_name] : undefined
                            }
                            >
                            아이템
                            </span> */}
                    
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
      {selectedItem && (
        <PreviewModal
            action="UserInfo"
            user={user}
            item={selectedItem}
            profileSrc={profileSrc}            // ← pass the current profile image URL
            inventoryItems={items}             // ← pass entire inventory array
            onClose={() => setSelectedItem(null)}
            on_click={() => clickItem(selectedItem)}
        />
 )}
    </div>
  );
};

export default UserInfo;