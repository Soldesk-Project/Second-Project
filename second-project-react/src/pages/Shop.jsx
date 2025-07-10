import React, { useEffect, useState } from 'react';
import Header from '../layout/Header';
import styles from '../css/ShopPage.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';
import ChargeModal from '../components/ChargeModal';
import { useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';

const Shop = () => {
  // 1) 포인트 충전 탭은 tabs 배열에서 제외함
  const allTabs = ['테두리', '칭호', '글자색', '배경', '말풍선', '랜덤박스'];
  const [activeTab, setActiveTab] = useState(allTabs[0]);
  const [items, setItems]   = useState([]);
  const [point, setPoint]   = useState(0);
  const [showModal, setShowModal] = useState(false);

  const user   = useSelector(state => state.user.user);
  const userId = user?.user_id;

  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/user/point?user_id=${userId}`)
      .then(res => setPoint(res.data))
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    // 포인트 충전 탭이 아니므로, activeTab만으로 fetch
    axios.get(`/api/shop/items?category=${encodeURIComponent(activeTab)}`)
      .then(res => setItems(res.data))
      .catch(() => setItems([]));
  }, [activeTab]);
  
  // console.log(items);
  

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
                <div key={item.item_no} className={styles.card}>
                  {/* <img src={item.imgUrl} alt={item.name} /> */}
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
                    {/* <div className={`${decoStyles[item.css_class_name]}`}>
                      아이템
                    </div> */}
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
    </div>
  );
};

export default Shop;
