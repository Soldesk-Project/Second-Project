import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/header.css';
import { useSelector } from 'react-redux';

const Header = () => {
  const server = useSelector((state) => state.user.server);
  const nav=useNavigate();
  const clickToGoMain=()=>{
    nav('/main/'+ server);
  }
  const clickToGo=(e)=>{
    const name = e.target.dataset.name;
    nav(`/${name}`);
  }
  const bb=()=>{
    console.log(123);
    
  }
  const cc=()=>{
    console.log(1231241);
    
  }
  return (
    <div className='header'>
      <ul className='header-category'>
        <li><div><img src="/images/logo.png" alt="로고" onClick={clickToGoMain} className='logo-img header-logo'/></div></li>
        <li><span onClick={clickToGoMain}>문제풀이</span></li>
        <li><span data-name="itemBook" onClick={clickToGo}>도감</span></li>
        <li><span data-name="achievements" onClick={clickToGo}>업적</span></li>
        <li><span data-name="shop" onClick={clickToGo}>상점</span></li>
        <li><span onClick={clickToGo}>고객센터</span></li>
        <li><input type="text" className='header-search' placeholder='search...'/></li>
        <li><img onClick={bb} className='header-enter' src="/images/enter.png" alt="엔터?" /></li>
        <li><img onClick={cc} className='header-signout' src="/images/signout.png" alt="나가기" /></li>
      </ul>
    </div>
  );  
};

export default Header;