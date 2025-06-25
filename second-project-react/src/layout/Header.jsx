import React from 'react';
import { Link } from 'react-router-dom';
import '../css/header.css';

const Header = () => {
  const clickToGoLobby=()=>{

  }
  const aa=()=>{

  }
  return (
    <div className='header'>
      <ul>
        <li><div className='logo'><img src="/images/logo.png" alt="로고" onClick={clickToGoLobby}/></div></li>
        <li><span onClick={aa}>문제풀이</span></li>
        <li><span onClick={aa}>문제제출</span></li>
        <li><span onClick={aa}>사용자모드</span></li>
        <li><span onClick={aa}>상점</span></li>
        <li><span onClick={aa}>고객센터</span></li>
        <li><input type="text" placeholder='search...'/></li>
        <li><button>나가기</button></li>
        <li><button>종료</button></li>
      </ul>
    </div>
  );
};

export default Header;