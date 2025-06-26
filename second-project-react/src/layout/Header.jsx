import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../css/header.css';

const Header = () => {
  const server=useParams();
  const nav=useNavigate();
  const clickToGoMain=()=>{
    nav('/main/'+server.serverNo)
  }
  const aa=()=>{

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
        <li><span onClick={aa}>문제풀이</span></li>
        <li><span onClick={aa}>상점</span></li>
        <li><span onClick={aa}>업적</span></li>
        <li><span onClick={aa}>상점</span></li>
        <li><span onClick={aa}>고객센터</span></li>
        <li><input type="text" className='header-search' placeholder='search...'/></li>
        <li><img onClick={bb} className='header-enter' src="/images/enter.png" alt="엔터?" /></li>
        <li><img onClick={cc} className='header-signout' src="/images/signout.png" alt="나가기" /></li>
      </ul>
    </div>
  );
};

export default Header;