import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, MemoryRouter } from 'react-router-dom';
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
import InPlay from './pages/gameroom/InPlay';
import CustomerServiceCenter from './pages/customer/CustomerServiceCenter';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { WebSocketProvider } from './util/WebSocketProvider';
import CustomerProblemSubmit from './pages/customer/CustomerProblemSubmit';
import AdminPage from './pages/AdminPage';
import InquiryDetail from './pages/customer/InquiryDetail';
import NaverCallback from './pages/login/NaverCallback';
import GoogleCallback from './pages/login/GoogleCallback';
import QuestionReview from './pages/gameroom/QuestionReview';
import ResetPasswordPage from './pages/login/ResetPasswordPage';
import ErrorEvent from './pages/ErrorEvent';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorEvent403 from './pages/ErrorEvent403';
import BanListener from "./util/BanListener";

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
    // <MemoryRouter initialEntries={["/"]}></MemoryRouter>
    // <Router> 대신 위에거 넣으면 히스토리를 메모리에서만 관리해서 유저가 히스토리 이동이 불가능해짐
    <WebSocketProvider>
      <Router>
      <BanListener/>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/server" element={<ServerSelect />} />
          <Route path="/signUp" element={<SignUp />} />
          <Route path="/findId" element={<FindId />} />
          <Route path="/findPw" element={<FindPw />} />
          <Route path="/kakao/callback" element={<KakaoCallback />} />
          <Route path="/api/naver/callback" element={<NaverCallback />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/main/:serverNo" element={<MainPage />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/gameRoom/:roomNo" element={<InPlay />} />
          <Route path="/questionReview" element={<QuestionReview />} />
          <Route path="/inquiries" element={<CustomerServiceCenter />} />
          <Route path="/inquiry" element={<CustomerProblemSubmit />} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminPage/></ProtectedRoute>}/>
          <Route path="/inquiries/:id" element={<InquiryDetail />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/403" element={<ErrorEvent403 />} />
          <Route path="/*" element={<ErrorEvent />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
}

export default App;