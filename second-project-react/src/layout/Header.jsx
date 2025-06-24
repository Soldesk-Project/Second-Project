import React from 'react';

const Header = () => {
  const clickToGoLobby=()=>{

  }
  return (
    <div className='header'>
      <ul>
        <li><img src="/images/logo.png" alt="로고" onClick={clickToGoLobby}/></li>
        <li>메뉴들</li>

      </ul>
    </div>
  );
};

export default Header;