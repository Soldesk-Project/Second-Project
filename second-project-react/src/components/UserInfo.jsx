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
import { useNavigate } from 'react-router-dom';

const TABS = ['테두리', '칭호', '글자색', '명함', '말풍선', '유니크'];

const UserInfo = ({userRankingList}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNickModalOpen, setIsNickModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [items, setItems]   = useState([]);
    const [editMyInfo, setEditMyInfo] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [point, setPoint] = useState(0);
    // const [challengerMinScore, setChallengerMinScore] = useState(0);
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.user);
    const shopItems = useSelector(state => state.shop.items);
    const userId = user?.user_id;
    const userNick = user?.user_nick;
    const challengerMinScore = userRankingList[9]?.user_rank;

    // 상점 아이템 목록 가져오기(유저 프로필 아이템 랜더링)
    const itemMap = React.useMemo(() => {
        return shopItems.reduce((m, it) => {
        m[it.item_no] = it;
        return m;
        }, {});
    }, [shopItems]);

    useEffect(() => {
        fetchGetPoint();
      }, [userNick]);

    const fetchGetPoint = async () => {
    if (!userId) return;
    try {
        const res = await axios.get(`/api/user/point?user_id=${userId}`);
        setPoint(res.data);
    } catch (error) {
        console.error('포인트 불러오기 실패:', error);
    }
    }

    useEffect(() => {
      if (!user?.user_no) return;
      dispatch(fetchUserInfo(user.user_no));
    }, [user.user_no, dispatch]);

    const { isTop10 } = useSelector((state) => state.ranking);
    const sockets = useContext(WebSocketContext);
    const socket = sockets.current['server'];

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
        '/images/profile_default.png',
    ];

    const onSelectProfile = (src) => {
        axios.patch(`/user/${user.user_no}/profile-image`, { imageUrl: src })
        .then(() => {
            setProfileSrc(src);
            dispatch({ type: 'user/setProfileImage', payload: src });
            setIsProfileModalOpen(false);

            if (socket && socket.readyState === 1) {
                socket.send(JSON.stringify({
                    action: 'updateStyle', // 기존과 동일한 액션
                    userNo: user.user_no
                }));
            } else {
                console.warn('WebSocket이 아직 연결되지 않음');
            }
        })
        .catch(err => {
            console.error('프로필 변경 실패', err);
            alert('서버 저장 중 오류가 발생했습니다.');
        });
    };

    useEffect(() => {
        if (!user.user_no) return;
            axios
      .get('/api/user/inventory/category', {
        params: { category: activeTab, user_no: user.user_no }
      })
      .then(({ data }) => {

        const withImg = data.map(item => {
        // 1) camelCase 프로퍼티부터 시도
        const raw =
          item.imageFileName ||
          'profile_default.png';

        // prefix 중복 제거
        const filename = raw.replace(/^\/images\//, '');

        const src = `/images/${filename}`;
          return { ...item, imgUrl: src };
        });
        setItems(withImg);
      })
      .catch(() => setItems([]));
    }, [activeTab, user.user_no]);

    // 티어에 따라 클래스명 반환 함수
    const getTierClass = () => {
        const rank = user.user_rank;
        if (rank > 800 && isTop10) return styles.challenger;
        if (rank > 800) return styles.diamond;
        if (rank > 400) return styles.platinum;
        if (rank > 200) return styles.gold;
        if (rank > 100) return styles.silver;
        return styles.bronze;
    };
    // 다음 티어 기준 점수 계산
    const getNextTierScore = () => {
        if (user.user_rank > 800) {
            if (isTop10) return null; // 챌린저면 다음 티어 없음
            return challengerMinScore; // 챌린저 10등 점수와 비교
        }
        if (user.user_rank > 400) return 800; // 플래 -> 다이아
        if (user.user_rank > 200) return 400; // 골드 -> 플래
        if (user.user_rank > 100) return 200; // 실버 -> 골드
        return 100; // 브론즈 -> 실버
    };

    const nextTier = getNextTierScore();

    // 진행률 계산
    const progressPercent = (() => {
        if (!nextTier) return 100; // 챌린저면 100%
        
        if (user.user_rank > 800) {
            // 다이아 → 챌린저 진행률 (챌린저 10위 점수 기준)
            const gap = nextTier - 800; // 800점에서 시작
            return Math.min(((user.user_rank - 800) / gap) * 100, 100);
        } else {
            // 일반 티어 진행률
            const prevTierBase =
                user.user_rank > 400 ? 400 :
                user.user_rank > 200 ? 200 :
                user.user_rank > 100 ? 100 : 0;

            const gap = nextTier - prevTierBase;
            return Math.min(((user.user_rank - prevTierBase) / gap) * 100, 100);
        }
    })();  

    const clickItem = async (item) => {
      try {
             const { status } = await axios.post('/api/user/item/select', {
                user_no : user.user_no,
                item_no : item.item_no,
                item_type : item.item_type
            });

            if (status === 200) {
                // 1) 랭킹 업데이트
                dispatch(triggerRefreshRanking());
                
                // 2) 최신 유저 정보 다시 가져오기
                const res = await axios.get(`/api/user/${user.user_no}`);
                
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
                dispatch(fetchUserInfo(user.user_no)); 
            } else if (data.type === 'userList') {
                // 서버에서 보낸 유저 리스트가 변경되었으니
                // 최신 유저 정보를 가져오거나 상태 업데이트 로직 실행
                dispatch(fetchUserInfo(user.user_no));
                dispatch(triggerRefreshRanking());
            }
                
        };

        socket.addEventListener('message', handleMessage);

        return () => { socket.removeEventListener('message', handleMessage); };
    }, [socket]);

    // 2) 사용자 통계 가져오기
    const [stats, setStats] = useState(null);
    useEffect(() => {
        if (!user.user_no) return;
        axios
        .get(`/api/user/accuracy/${user.user_nick}`)
        .then(res => setStats(res.data))
        
        .catch(err => console.error(err));
    }, [user.user_no]);    
        
    // 2) 퍼센트 계산
    // --- 퍼센트 계산 (통계가 로딩되지 않았으면 0으로)
    const answerPercent = stats?.[0]?.accuracyPct || 0;
        
    const handleNicknameChange = (newNick) => {
        if(point < 5000){
            alert("포인트 부족")
            return;
        }
        axios.patch(`/api/user/${user.user_no}/nickname`, { user_nick: newNick, user_id: userId })
            .then(res => {
                const updatedUser = {
                    ...user,
                    user_nick: newNick,
                };
                dispatch(setUser(updatedUser));
                alert('닉네임이 변경되었습니다!');

                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                    action: 'updateNick',
                    userNo: user.user_no,
                    userNick: newNick
                    }));
                } else {
                    console.warn('WebSocket이 아직 연결되지 않음');
                }
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

    const handleClearStyle=async ()=>{
        await axios.patch(`/api/user/${user.user_no}/clearStyle`);
        
        const res = await axios.get(`/api/user/${user.user_no}`);
                
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
    }
    const fontcolor = itemMap[user.fontcolorItemNo]?.css_class_name;
  return (
    <div>
        <div className={styles.userInfo_Box}>
            <div className={styles.userInfo_Box_1}>
                <div className={styles.profileWrapper}>
                    <img 
                        src={profileSrc} 
                        alt='/images/profile_default.png'  
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
                        alt="/images/defaultProfileBoarder"
                        className={styles.frameOverlay}
                    />
                    )}
                </div>

            <div className={styles.userInfo_Name}>
                <p className={decoStyles[fontcolor]}>{user.user_nick}</p>
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
            <div className={styles.progressLine}>
                <div
                className={styles.progressFill}
                style={{ width: `${answerPercent}%` }}
                />
            </div>
            <div className={styles.label}>{answerPercent}% 정답률</div>
            </div>
        </div>
        <div className={styles.editMyInfoBtnWrapper}>
            {
                editMyInfo?
                <button className={styles.editMyInfoBtn} onClick={() => setEditMyInfo(false)}>돌아가기</button>
                :
                <button className={styles.editMyInfoBtn} onClick={() => setEditMyInfo(true)}>내 정보 수정</button>
            }
        </div>
        {
            editMyInfo?
            <>
                <div className={styles.invenBtnWrapper}>
                    <button className={styles.invenBtn} onClick={() => setIsModalOpen(true)}>Inventory</button>
                    <button className={styles.invenBtn} onClick={() => setIsNickModalOpen(true)}>닉네임 변경</button>
                    <button className={styles.invenBtn} onClick={handleChangePw} disabled={loading}>{loading ? '요청 중...' : '비밀번호 변경'}</button>
                </div>
            </>:
            <>
            <div className={styles.tierArea}>
                <div className={`${styles.tierBadge} ${getTierClass()}`}></div>
            </div>
            {/* ✅ 티어 점수 바 추가 */}
            <div className={styles.rankBarWrapper}>
            <div className={styles.rankBar}>
                <div 
                className={styles.rankFill} 
                style={{ width: `${progressPercent}%` }}
                />
            </div>
            <div className={styles.rankLabel}>
                {user.user_rank} RP 
                {nextTier && ` / 다음 티어까지 ${nextTier - user.user_rank}점`}
            </div>
            </div>
            </>
        }

        <NickModal isOpen={isNickModalOpen} onClose={() => setIsNickModalOpen(false)}  onSubmit={handleNicknameChange} point={point}/>

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
                    items.map(item => {
                        const isWhiteFont = item.css_class_name === 'white_fontColor'; // 하얀 글씨 여부 판단
                        
                        return (
                        <div key={item.item_no} className={styles.card} onClick={() => setSelectedItem(item)}>
                            <div className={styles.itemCss}>
                            {(item.item_type === 'boundary' || item.item_type === 'background' || item.item_type === 'balloon' 
                                || (item.item_type==='unique' && item.item_no===118) 
                                || (item.item_type==='unique' && item.item_no===119)) ? (
                                <img 
                                src={item.imgUrl}
                                alt={item.item_name}
                                className={styles.itemImage}
                                />
                            ) : (
                                <span 
                                className={`${decoStyles[item.css_class_name]} ${isWhiteFont ? decoStyles.whiteShadow : ''}`}
                                >
                                [{titleTextMap[item.css_class_name]}]
                                </span>
                            )}
                            </div>
                            <div className={styles.itemName}>이름 : {item.item_name}</div>
                        </div>
                        );
                    })
                ) : (
                    <div>상품이 없습니다.</div>
                )}
                {
                    (activeTab==='칭호' && items.length>0) &&
                    <div className={styles.card} onClick={() => handleClearStyle()}>
                        <div className={styles.itemNone}>클릭 하여 즉시 장착해제</div>
                    </div>
                }
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