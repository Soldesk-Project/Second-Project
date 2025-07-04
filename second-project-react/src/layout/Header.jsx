import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/header.css';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { clearUser, clearServer } from '../store/userSlice';

const Header = () => {
  const server = useSelector((state) => state.user.server);
  const nav=useNavigate();
  const dispatch = useDispatch();

  const clickToGoMain=()=>{
    nav('/main/'+ server);
  }
  const clickToGo=(e)=>{
    const name = e.target.dataset.name;
    console.log('navigate to:', name);
    nav(`/${name}`);
  }
  const serverOut=()=>{
    dispatch(clearServer());
    nav('/server');   
  }
  const logOut=()=>{
    dispatch(clearUser());
    localStorage.clear(); 
    nav('/');  
  }
  return (
    <div className='header'>
      <div className='header-box-left'>
        <ul className='header-category'>
          <li><div><img src="/images/logo.png" alt="로고" onClick={clickToGoMain} className='logo-img header-logo'/></div></li>
          <li><span onClick={clickToGoMain}>문제풀이</span></li>
          <li><span data-name="itemBook" onClick={clickToGo}>도감</span></li>
          <li><span data-name="achievements" onClick={clickToGo}>업적</span></li>
          <li><span data-name="shop" onClick={clickToGo}>상점</span></li>
          <li><span data-name="inquiries" onClick={clickToGo}>고객센터</span></li>
        </ul>
      </div>
      <div className='header-box-right'>
        <img onClick={serverOut} className='header-enter' src="/images/door-open.png" alt="서버이동" />
        <img onClick={logOut} className='header-signout' src="/images/signout.png" alt="나가기" />
      </div>
    </div>
  );  
};

export default Header;