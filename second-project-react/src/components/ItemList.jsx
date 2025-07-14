import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../css/ItemList.module.css';
import decoStyles from '../css/Decorations.module.css';
import axios from 'axios';
import { useSelector } from 'react-redux';
import titleTextMap from '../js/Decorations';

const ItemList = () => {
  const [items, setItems]   = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [visibleSections, setVisibleSections] = useState({
    boundary: false,
    title: false,
    fontcolor: false,
    background: false,
  });
  const allItemsRef = useRef(null);
  const user   = useSelector(state => state.user.user);
  
  const ownedItemNos = useMemo(() => new Set(ownedItems.map(item => item.item_name)), [ownedItems]);
  const isOwned = (item_name) => ownedItemNos.has(item_name);

  const fetchGetItems = async () => {
    if (!user.user_no) return;
    try {
      const res = await axios.get(`/user/getItems?user_no=${user.user_no}`);
      setOwnedItems(res.data);
    } catch (error) {
      console.error('유저 아이템 불러오기 실패:', error);
    }
  }

  useEffect(() => {
      fetchGetItems();
    }, [user.user_no]);

  useEffect(() => {
        axios.get('/user/item')
        .then((res) => setItems(res.data))
        .catch(() => setItems([]));
    }, []);

  useEffect(() => {
    if (!visibleSections.boundary) return;

    const dropdown = allItemsRef.current;
    if (!dropdown) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      dropdown.scrollLeft += e.deltaY;
    };

    dropdown.addEventListener("wheel", onWheel);
    return () => dropdown.removeEventListener("wheel", onWheel);
  }, [visibleSections.boundary]);

  useEffect(() => {
    if (!visibleSections.title) return;

    const dropdown = allItemsRef.current;
    if (!dropdown) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      dropdown.scrollLeft += e.deltaY;
    };

    dropdown.addEventListener("wheel", onWheel);
    return () => dropdown.removeEventListener("wheel", onWheel);
  }, [visibleSections.title]);

  useEffect(() => {
    if (!visibleSections.fontcolor) return;

    const dropdown = allItemsRef.current;
    if (!dropdown) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      dropdown.scrollLeft += e.deltaY;
    };

    dropdown.addEventListener("wheel", onWheel);
    return () => dropdown.removeEventListener("wheel", onWheel);
  }, [visibleSections.fontcolor]);

  useEffect(() => {
    if (!visibleSections.background) return;

    const dropdown = allItemsRef.current;
    if (!dropdown) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      dropdown.scrollLeft += e.deltaY;
    };

    dropdown.addEventListener("wheel", onWheel);
    return () => dropdown.removeEventListener("wheel", onWheel);
  }, [visibleSections.background]);

  const boundaryItems = items.filter(item => item.item_type === 'boundary');
  const titleItems = items.filter(item => item.item_type === 'title');
  const fontcolorItems = items.filter(item => item.item_type === 'fontColor');
  const backgroundItems = items.filter(item => item.item_type === 'background');

  return (
    <div className={styles.box}>

      <div
        onClick={() =>
          setVisibleSections((prev) => ({
            ...prev,
            boundary: !prev.boundary,
          }))
        }
        className={styles.title}
      >
        BOUNDARY ITEM
      </div>

      {visibleSections.boundary && (
        <div className={styles.dropdown} ref={allItemsRef}>
          {boundaryItems.length ? (
            boundaryItems.map(item => (
              <div key={item.item_no}  className={`${styles.card} ${isOwned(item.item_name) ? styles.owned : ''}`}>
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
      )}

      <div
        onClick={() =>
          setVisibleSections((prev) => ({
            ...prev,
            title: !prev.title,
          }))
        }
        className={styles.title}
      >
        TITLE ITEM
      </div>

      {visibleSections.title && (
        <div className={styles.dropdown} ref={allItemsRef}>
          {titleItems.length ? (
            titleItems.map(item => (
              <div key={item.item_no} className={`${styles.card} ${isOwned(item.item_name) ? styles.owned : ''}`}>
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
      )}

      <div
        onClick={() =>
          setVisibleSections((prev) => ({
            ...prev,
            fontcolor: !prev.fontcolor,
          }))
        }
        className={styles.title}
      >
        FONTCOLOR ITEM
      </div>

      {visibleSections.fontcolor && (
        <div className={styles.dropdown} ref={allItemsRef}>
          {fontcolorItems.length ? (
            fontcolorItems.map(item => (
              <div key={item.item_no} className={`${styles.card} ${isOwned(item.item_name) ? styles.owned : ''}`}>
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
      )}

      <div
        onClick={() =>
          setVisibleSections((prev) => ({
            ...prev,
            background: !prev.background,
          }))
        }
        className={styles.title}
      >
        BACKGROUND ITEM
      </div>

      {visibleSections.background && (
        <div className={styles.dropdown} ref={allItemsRef}>
          {backgroundItems.length ? (
            backgroundItems.map(item => (
              <div key={item.item_no} className={`${styles.card} ${isOwned(item.item_name) ? styles.owned : ''}`}>
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
      )}

    </div>
  );
};

export default ItemList;