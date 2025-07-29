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
  const [shopBgItems, setShopBgItems]         = useState([]);
  const [itemList, setItemList]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [isModalOpen, setIsModalOpen]       = useState(false);

  const dispatch       = useDispatch();
  const { user }       = useSelector(state => state.user);
  const refreshRanking = useSelector(state => state.ranking.refreshRanking);

  const sockets = useContext(WebSocketContext);
  const socket  = sockets['server'];
  const user_no = user.user_no;

  // 1) 유저 랭킹 불러오기
  const fetchUserRanking = async () => {
    try {
      const { data, status } = await axios.get('/user/ranking');
      if (status === 200) {
        setUserRankingList(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('유저 랭킹 로드 실패:', error);
    }
  };

  // 2) 인벤토리(착용 가능한 아이템) 불러오기 & imgUrl 세팅
  const fetchItemList = async () => {
    try {
      const { data, status } = await axios.get('/user/item');
      if (status === 200) {
        const itemsWithUrl = data.map(it => ({
          ...it,
          imgUrl: it.imageFileName
            ? `/images/${it.imageFileName}`
            : ''
        }));
        setItemList(itemsWithUrl);
      }
    } catch (error) {
      console.error('아이템 목록 로드 실패:', error);
    }
  };

  // 2.1) 샵 전체 배경 아이템 불러오기 & imgUrl 세팅
  useEffect(() => {
    axios.get('/api/shop/items?category=배경')
      .then(({ data }) => {
        const bgWithUrl = data.map(it => ({
          ...it,
          imgUrl: it.imageFileName ? `/images/${it.imageFileName}` : ''
        }));
        setShopBgItems(bgWithUrl);
      })
      .catch(err => console.error('샵 배경 아이템 로드 실패:', err));
  }, []);

  // 3) 마운트 시 한 번만 인벤토리 로드
  useEffect(() => {
    fetchItemList();
  }, []);

  // 4) refreshRanking 또는 닉네임 변경 시 랭킹 갱신
  useEffect(() => {
    fetchUserRanking();
  }, [refreshRanking, user.user_nick]);

  // 5) WebSocket 메시지 핸들링
  useEffect(() => {
    if (!socket) return;

    const handleMessage = event => {
      const data = JSON.parse(event.data);
      if (data.type === 'styleUpdated') {
        fetchUserRanking();
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  // 6) Top10 여부 Redux에 저장
  useEffect(() => {
    if (user_no && userRankingList.length > 0) {
      const isTop10 = userRankingList
        .slice(0, 10)
        .some(u => u.user_no === user_no);
      dispatch(setIsTop10(isTop10));
    }
  }, [userRankingList, user_no, dispatch]);

  // 7) 클릭 시 착용하기
  const handleItemSelect = async (css_class_name, item_type) => {
    try {
      const { status } = await axios.post('/user/item/select', {
        css_class_name,
        item_type,
        user_no
      });
      if (status === 200) {
        await fetchItemList();
        await fetchUserRanking();

        if (socket && socket.readyState === 1) {
          socket.send(
            JSON.stringify({ action: 'updateStyle', userNo: user_no })
          );
        } else {
          console.warn('WebSocket이 아직 연결되지 않음');
        }
      }
    } catch (error) {
      console.error('아이템 전송 중 에러:', error);
    }
  };

  
  // 8) item_no → 전체 아이템 객체 매핑
  const itemMap = React.useMemo(() => {
    return itemList.reduce((m, it) => {
        m[it.item_no] = it;
        return m;
    }, {});
}, [itemList]);

    const bgMap = React.useMemo(() => {
    return shopBgItems.reduce((m, it) => {
      m[it.item_no] = it;
      return m;
    }, {});
  }, [shopBgItems]);

if (loading) return <div>로딩 중...</div>;

  // 9) 렌더링
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* <button
          className={styles.itemButton}
          onClick={() => setIsModalOpen(true)}
        >
          아이템
        </button> */}
        유저 랭킹
      </div>

      <div className={styles.userList}>
        {userRankingList.map(
          ({
            user_no,
            user_nick,
            // boundaryItemNo,
            backgroundItemNo,
            titleItemNo,
            fontcolorItemNo
          }) => {
            const bgItem   = bgMap[backgroundItemNo] || itemMap[backgroundItemNo];
            const bgStyle  = bgItem?.imgUrl
              ? {
                  backgroundImage: `url(${bgItem.imgUrl})`,

                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }
              : {};
            const titleCls = itemMap[titleItemNo]?.css_class_name;
            const fontCls  = itemMap[fontcolorItemNo]?.css_class_name;

            return (
              <div
                key={user_no}
                className={styles.user}
                style={bgStyle}
              >
                <div>
                  {titleCls && titleTextMap[titleCls] && (
                    <span
                      className={decoStyles[titleCls]}
                      style={{ marginRight: '5px', fontWeight: 'bold' }}
                    >
                      [{titleTextMap[titleCls]}]
                    </span>
                  )}
                  <span className={ fontCls ? decoStyles[fontCls] : '' }>
                  {user_nick}
                  </span>
                </div>
              </div>
            );
          }
        )}

        <TestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="아이템 테스트"
        >
          {Object.entries(
            itemList.reduce((acc, it) => {
              (acc[it.item_type] ||= []).push(it);
              return acc;
            }, {})
          ).map(([type, items]) => (
            <div key={type} className={styles.itemGroup}>
              <h5>{type}</h5>
              {items.map(
                ({ item_no, item_name, css_class_name, item_type }) => (
                  <div
                    key={item_no}
                    style={{ cursor: 'pointer', padding: '4px 0' }}
                    onClick={() =>
                      handleItemSelect(css_class_name, item_type)
                    }
                  >
                    {item_name}
                  </div>
                )
              )}
            </div>
          ))}
        </TestModal>
      </div>
    </div>
  );
};

export default UserRanking;
