import React, { useState } from 'react';
import Header from '../layout/Header';

const Shop = () => {
    return(
        <div className="main-container"> {/* 공간 부터 나눴음*/}
            {/* 상단 바 (로고 + 메뉴 + 검색) */}
            <div className='top-nav'><Header/></div>
        </div>
    )
};

export default Shop;