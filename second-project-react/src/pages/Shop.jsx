import React, { useEffect, useState } from 'react';
import Header from '../layout/Header';
import styles from '../css/ShopPage.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';
import ChargeModal from '../components/ChargeModal';
import { useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';
import PreviewModal from '../components/modal/PreviewModal';

const Shop = () => {
  const allTabs = ['테두리', '칭호', '글자색', '명함', '말풍선'];
  const [activeTab, setActiveTab] = useState(allTabs[0]);
  const [items, setItems]   = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [point, setPoint]   = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [profileSrc, setProfileSrc] = useState('/images/profile_default.png');

  const user   = useSelector(state => state.user.user);
  const userId = user?.user_id;

  const fetchGetPoint = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`/api/user/point?user_id=${userId}`);
      setPoint(res.data);
    } catch (error) {
      console.error('포인트 불러오기 실패:', error);
    }
  }

  const fetchGetItems = async () => {
    if (!user.user_no) return;
    try {
      const res = await axios.get(`/user/getItems?user_no=${user.user_no}`);
      setOwnedItems(res.data);
    } catch (error) {
      console.error('포인트 불러오기 실패:', error);
    }
  }

  useEffect(() => {
    fetchGetPoint();
  }, [userId]);

  useEffect(() => {
    fetchGetItems();
  }, [user.user_no]);

  useEffect(() => {
          if (!user?.user_profile_img) return;
          const raw = user.user_profile_img;
          const src = raw.startsWith('/images/')
              ? raw
              : `/images/${raw}`;
          setProfileSrc(src);
          }, [user.user_profile_img]);
  
  useEffect(() => {
    // 아이템 탭
    axios.get(`/api/shop/items?category=${encodeURIComponent(activeTab)}`)
      .then(res => {
        const withImg = res.data.map(item => {
          const filename = item.imageFileName;
          
          return {
          ...item,
          imgUrl: `/images/${filename}`
        }});
        setItems(withImg);
      })
      .catch(() => setItems([]));
  }, [activeTab]);
  
  const fetchBuyItemInventory = async (item) => {
        try {
          const params = new URLSearchParams();
          params.append("user_no", user.user_no);
          params.append("item_name", item.item_name);
          params.append("item_type", item.item_type);
          params.append("item_price", item.item_price);
          params.append("css_class_name", item.css_class_name);

          console.log(params.item_name);
          
          const { data, status } = await axios.post('/api/shop/buyItemInventory', params);
          if (status === 200) {
            fetchGetPoint();
            fetchGetItems();
          } else {
              throw new Error('아이템 구매 실패');
          }
        } catch (error) {
            console.error('아이템 구매 로드 실패:', error);
        }
    };

  const buyItem = (item) => {
    const isOwned = ownedItems.some(
      owned => owned.item_name === item.item_name
    );

    if (isOwned) {
      return alert('이미 보유한 아이템입니다!');
    }
    if(user.user_point < item.item_price) return alert("point 부족!");
    fetchBuyItemInventory(item);
    setSelectedItem(null);
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.top_nav}>
        <Header/>
      </div>

      {/* 탭 + 포인트 영역 */}
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

        <div className={styles.subTabRight}>
          <span>내 포인트: {point.toLocaleString()} p</span>
          <button
            className={styles.chargeBtn}
            onClick={() => setShowModal(true)}
          >
            포인트 충전
          </button>
        </div>
      </div>

    {/* 상품 영역 */}
      <div className={styles.scrollArea}>
        <div className={styles.shopMaingrid}>
          <div className={styles.grid}>
            {items.length ? (
              items.map(item => (
                <div 
                  key={item.item_no} 
                  className={styles.card} 
                  onClick={() => setSelectedItem(item)}>
                  <div className={styles.itemCss}>
                  {/* 가끔 경로가 안되는 경우가 있음 */}
                  {/* <img  
                    src={`/images/${item.imageFileName}`} 
                    alt={item.item_name} 
                    className={styles.itemImage} /> */}
                  {item.item_type === 'title' && (
                  // 1) 칭호: 텍스트 매핑
                  <span
                    className={decoStyles[item.css_class_name]}
                    style={{ fontWeight: 'bold', fontSize: '1.2em' }}
                  >
                    { titleTextMap[item.css_class_name] || item.item_name }
                  </span>
                )}

                {item.item_type === 'fontColor' && (
                  // 2) 글자색: 고정 텍스트 + 컬러 클래스
                  <span
                    className={decoStyles[item.css_class_name]}
                    style={{ fontSize: '1.5em' }}
                  >
                    가나다abc
                  </span>
                )}

                {item.item_type === 'etc' && (
                  // 3) 기타: 고정 텍스트
                  <span
                    className={decoStyles[item.css_class_name]}
                    style={{ fontWeight: 'bold', fontSize: '1.2em', color: 'black' }}
                  >
                    { titleTextMap[item.css_class_name] || item.item_name }
                  </span>
                )}

                {item.item_type !== 'title' && item.item_type !== 'fontColor' && item.item_type !== 'etc' && (
                  // 3) 나머지(테두리, 배경, 말풍선, 기타): 이미지
                  <img
                    src={item.imgUrl}
                    alt={item.item_name}
                    className={styles.itemImage}
                  />
                )}
                  </div>
                  <div className={styles.itemName}>이름 : {item.item_name}</div>
                  <div className={styles.itemPrice}>가격 : {item.item_price ? item.item_price.toLocaleString() : '가격 미정'} p</div>
                </div>
              ))
            ) : (
              <div>상품이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {showModal && <ChargeModal onClose={() => setShowModal(false)} />}
      {selectedItem && (<PreviewModal action={'Shop'} user={user} profileSrc={profileSrc} item={selectedItem} onClose={() => setSelectedItem(null)} on_click={() => buyItem(selectedItem)} />)}
    </div>
  );
};

export default Shop;
