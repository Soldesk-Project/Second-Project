import React, { useEffect, useState } from 'react';
import Header from '../layout/Header';
import styles from '../css/ShopPage.module.css';
import axios from 'axios';
import ChargeModal from '../components/ChargeModal';

const Shop = () => {
  const tabs = ['테두리', '칭호', '배경', '말풍선', '랜덤박스', '포인트 충전'];
  const [point, setPoint] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const user_id = 'rudalsfive';

  useEffect(() => {
    const fetchPoint = async () => {
      try {
        const res = await axios.get(`/api/user/point?user_id=${user_id}`);
        setPoint(res.data);
      } catch (err) {
        console.error('포인트 조회 실패:', err);
      }
    };
    fetchPoint();
  }, []);

  const handleTabClick = (tab) => {
    if (tab === '포인트 충전') {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="top-nav"><Header /></div>

      {/* 하위 탭 + 포인트 표시 */}
      <div className={styles.subTabContainer}>
        <div className={styles.subTabLeft}>
          {tabs.map((tab, idx) => (
            <span
              key={idx}
              className={styles.tabItem}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className={styles.subTabRight}>
          내 포인트: {point.toLocaleString()} p
        </div>
      </div>

      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx} className={styles.card}></div>
        ))}
      </div>

      {showModal && <ChargeModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default Shop;
