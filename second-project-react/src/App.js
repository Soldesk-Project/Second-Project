import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setUser } from './store/userSlice';

import LoginForm from './pages/login/LoginForm';
import MainPage from './pages/MainPage';
import KakaoCallback from './pages/login/KakaoCallback';
import ServerSelect from './pages/login/ServerSelect';
import SignUp from './pages/login/SignUp';
import FindId from './pages/login/FindId';
import FindPw from './pages/login/FindPw';
import Shop from './pages/Shop';
import Achievements from './pages/Achievements';
import ItemBook from './pages/ItemBook';
import InPlay from './pages/InPlay';
import CustomerServiceCenter from './pages/CustomerServiceCenter';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        dispatch(setUser(res.data)); // ✅ 유저 정보 Redux에 저장
      })
      .catch((err) => {
        console.error('JWT 토큰 복원 실패:', err);
        localStorage.removeItem('token');
      });
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/server" element={<ServerSelect />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/findId" element={<FindId />} />
        <Route path="/findPw" element={<FindPw />} />
        <Route path="/kakao/callback" element={<KakaoCallback />} />
        <Route path="/main/:serverNo" element={<MainPage />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/itemBook" element={<ItemBook />} />
        <Route path="/gameRoom/:roomNo" element={<InPlay />} />
        <Route path="/customer" element={<CustomerServiceCenter />} />
      </Routes>
    </Router>
  );
}

export default App;
