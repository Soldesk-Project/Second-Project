import React from 'react';
import styles from '../css/itemList.css';

const ItemList = () => {
  return (
    <div className='inven-box'>
      <div style={{width:'100px', height:'100px', backgroundColor:'gray', margin:'15px'}}>아이템</div>
      <div style={{width:'100px', height:'100px', backgroundColor:'gray', margin:'15px'}}>아이템</div>
      <div style={{width:'100px', height:'100px', backgroundColor:'gray', margin:'15px'}}>아이템</div>
      <div style={{width:'100px', height:'100px', backgroundColor:'gray', margin:'15px'}}>아이템</div>
    </div>
  );
};

export default ItemList;