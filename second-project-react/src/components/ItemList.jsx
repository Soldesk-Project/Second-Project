import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../css/ItemList.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';
import { useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';

const ITEM_TYPES = [
  { key: 'boundary', label: '프로필 테두리' },
  { key: 'title', label: '칭호' },
  { key: 'fontColor', label: '글자색' },
  { key: 'background', label: '명함' },
  { key: 'unique', label: '유니크 아이템' },
];

const REWARDS = {
  // boundary: { css_class_name: 'rainbow_bd', item_name: 'rainbow_boundary'},
  title: { css_class_name: 'collector_title', item_name: '콜렉터', item_type: 'unique'},
  fontColor: { css_class_name: 'rainbow_fontColor', item_name: '무지개 글자', item_type: 'unique'},
  // background: { css_class_name: 'rainbow_bg', item_name: 'rainbow_background'},
};

const ItemList = () => {
  const [items, setItems] = useState([]); // 전체 아이템
  const [ownedItems, setOwnedItems] = useState([]); // 보유 아이템
  const [visibleSections, setVisibleSections] = useState({
    boundary: false,
    title: false,
    fontColor: false,
    background: false,
  });
  const [rewardReceived, setRewardReceived] = useState({});
  const [reloadRewardStatus, setReloadRewardStatus] = useState(false);

  const dropdownRefs = useRef({});
  const isDragging = useRef({});
  const startX = useRef({});
  const scrollLeft = useRef({});
  const user = useSelector(state => state.user.user);

  // 보유 아이템 체크
  const ownedItemNames = useMemo(() => new Set(ownedItems.map(item => item.item_name)), [ownedItems]);
  const isOwned = (name) => ownedItemNames.has(name);

  // 보유 아이템 가져오기
  useEffect(() => {
    if (user.user_no) {
      axios.get(`/user/getItems?user_no=${user.user_no}`)
        .then(res => setOwnedItems(res.data))
        .catch(err => console.error('유저 아이템 불러오기 실패:', err));
    }
  }, [user.user_no, rewardReceived]);

  // 전체 아이템 가져오기
  useEffect(() => {
    axios.get('/user/item')
      .then(res => {
        const withImg = res.data.map(item => {
          const fileName = item.imageFileName;
          
          return {
            ...item,
            imgUrl: `/images/${fileName}`
          }});
          setItems(withImg);
        })
      .catch(() => setItems([]));
  }, []);

  // 리워드 상태 가져오기
  useEffect(() => {
    if (user.user_no) {
      axios.get(`/user/rewardStatus?user_no=${user.user_no}`)
        .then(res => {
          setRewardReceived(res.data); // ✅ 서버에서 수령 상태 받아옴
        })
        .catch(err => console.error('리워드 상태 불러오기 실패:', err));
    }
  }, [user.user_no, reloadRewardStatus]);
  
  // 아이템 타입별 필터 및 소유 개수, 퍼센트 계산 함수
  const getItemStats = useCallback((type) => {
    const filtered = items.filter(item => item.item_type === type);
    const ownedCount = filtered.filter(item => isOwned(item.item_name)).length;
    const totalCount = filtered.length;
    const percent = totalCount ? Math.round((ownedCount / totalCount) * 100) : 0;
    return { filtered, ownedCount, totalCount, percent };
  }, [items, ownedItemNames]);

  // 휠 스크롤 이벤트 핸들러
  const createWheelHandler = useCallback((type) => {
    return (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      const container = dropdownRefs.current[type];
      if (container) container.scrollLeft += e.deltaY;
    };
  }, []);

  //마우스 드래그 스크롤 이벤트 핸들러
  const handleDragStart = useCallback((type, e) => {
    const container = dropdownRefs.current[type];
    if (!container) return;

    isDragging.current[type] = true;
    startX.current[type] = e.pageX - container.offsetLeft;
    scrollLeft.current[type] = container.scrollLeft;
  }, []);

  const handleDragMove = useCallback((type, e) => {
    if (!isDragging.current[type]) return;

    const container = dropdownRefs.current[type];
    if (!container) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = x - startX.current[type];
    container.scrollLeft = scrollLeft.current[type] - walk;
  }, []);

  const handleDragEnd = useCallback((type) => {
    isDragging.current[type] = false;
  }, []);

  // 휠 이벤트 리스너 등록 / 해제
  useEffect(() => {
    const types = Object.keys(visibleSections);
    const listeners = {};

    types.forEach((type) => {
      const container = dropdownRefs.current[type];
      if (!visibleSections[type] || !container) return;

      const wheelHandler = createWheelHandler(type);
      container.addEventListener('wheel', wheelHandler);
      listeners[type] = wheelHandler;
    });

    return () => {
      types.forEach((type) => {
        const container = dropdownRefs.current[type];
        if (container && listeners[type]) {
          container.removeEventListener('wheel', listeners[type]);
        }
      });
    };
  }, [visibleSections, createWheelHandler]);
  
  
  // 리워드 핸들러
  const handleRewardClick = (typeKey) => {
    
    const reward = REWARDS[typeKey];
    console.log(reward.item_type);
    
    if (!reward) return;
    // API 호출 등 비동기 처리도 가능
    axios.post('/user/reward', { item_type: reward.item_type, user_no: user.user_no, css_class_name: reward.css_class_name, item_name: reward.item_name })
    .then(() => {
      const updated = {
        ...rewardReceived,
        [typeKey]: 'Y',
        user_no: user.user_no
      };

      setRewardReceived(updated);
      axios.post('/user/rewardUpdate', { user_no: updated.user_no, boundary: updated.boundary, title: updated.title, fontColor: updated.fontColor, background: updated.background })
      .then(() => {
          setReloadRewardStatus(prev => !prev);
        })
        .catch(console.error);
      })
      .catch(console.error);
  };

  const nameChange=(name)=>{
    switch (name) {
      case "pinkProfileBorder": return "핑크 테두리";
      case "lineProfileBorder": return "줄무늬 테두리";
      case "defaultProfileBorder": return "기본 테두리";
      case "dogProfileBorder.png": return "강아지 테두리";
      case "leafProfileBorder": return "잎 테두리";
      case "catProfileBorder": return "고양이 테두리";
      default: return name;
    }
  }

  // UI 렌더링 함수
  const renderItemSection = (typeKey, label) => {
    const { filtered, ownedCount, totalCount, percent } = getItemStats(typeKey);
    const isVisible = visibleSections[typeKey];
    const isRewarded = rewardReceived[typeKey] === 'Y';
    const canReward = ownedCount === totalCount && totalCount > 0 && !isRewarded;

    return (
      <div key={typeKey} className={styles.category}>
        <div
          className={styles.title}
          onClick={() =>
            setVisibleSections(prev => ({
              ...prev,
              [typeKey]: !prev[typeKey],
            }))
          }
        >
          <div>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>{ownedCount} / {totalCount} ({percent}%)</span>
            {ownedCount === totalCount && totalCount > 0 && ( (typeKey!== 'unique') &&
              <button
                disabled={!canReward}
                className={`${styles.rewardButton} ${!canReward ? styles.rewardButtonDisabled : ''}`}
                onClick={(e) => {e.stopPropagation(); handleRewardClick(typeKey)}}
              >
                {isRewarded ? '보상 받기 완료' : '보상 받기'}
              </button>
            )}
          </div>
        </div>

        {isVisible && (
          <div
            className={styles.dropdown}
            ref={(el) => (dropdownRefs.current[typeKey] = el)}
            onMouseDown={(e) => handleDragStart(typeKey, e)}
            onMouseMove={(e) => handleDragMove(typeKey, e)}
            onMouseUp={() => handleDragEnd(typeKey)}
            onMouseLeave={() => handleDragEnd(typeKey)}
          >
            {filtered.length ? (
              filtered.map(item => (
                <div
                  key={item.item_no}
                  className={`${styles.card} ${isOwned(item.item_name) ? styles.owned : ''}`}
                >
                  <div className={styles.itemCss}>
                    <div>
                      {item.item_type === 'title' && titleTextMap[item.css_class_name] && (
                        <span className={decoStyles[item.css_class_name]} style={{ marginRight: '5px', fontWeight: 'bold' }}>
                          [{titleTextMap[item.css_class_name]}]
                        </span>
                      )}
                      {
                        typeKey==='boundary'||typeKey==='background'?
                        <img src={item.imgUrl} alt={item.item_name} className={styles.itemImage}/>
                        :
                        (
                          item.item_no===110?
                            <span className={item.item_type !== 'title' ? decoStyles[item.css_class_name] : undefined}>
                              콜렉터
                            </span>
                          :
                            <span className={item.item_type !== 'title' ? decoStyles[item.css_class_name] : undefined}>
                              아이템
                            </span>
                        )
                      }
                    </div>
                  </div>
                  <div className={styles.itemName}>{nameChange(item.item_name)}</div>
                </div>
              ))
            ) : (
              <div>상품이 없습니다.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.box}>
      {ITEM_TYPES.map(({ key, label }) => renderItemSection(key, label))}
    </div>
  );
};

export default ItemList;
