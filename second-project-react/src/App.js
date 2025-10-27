import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, MemoryRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setUser, loadUserFromStorage } from './store/userSlice';

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

    dispatch(loadUserFromStorage())

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
    <Router basename="/Second_Project">
      <WebSocketProvider>
      <BanListener/>
        <Routes>
          <Route path="/Second_Project" element={<LoginForm />} />
          <Route path="/Second_Project/server" element={<ServerSelect />} />
          <Route path="/Second_Project/signUp" element={<SignUp />} />
          <Route path="/Second_Project/findId" element={<FindId />} />
          <Route path="/Second_Project/findPw" element={<FindPw />} />
          <Route path="/Second_Project/kakao/callback" element={<KakaoCallback />} />
          <Route path="/Second_Project/api/naver/callback" element={<NaverCallback />} />
          <Route path="/Second_Project/google/callback" element={<GoogleCallback />} />
          <Route path="/Second_Project/main/:serverNo" element={<MainPage />} />
          <Route path="/Second_Project/shop" element={<Shop />} />
          <Route path="/Second_Project/gameRoom/:roomNo" element={<InPlay />} />
          <Route path="/Second_Project/questionReview" element={<QuestionReview />} />
          <Route path="/Second_Project/inquiries" element={<CustomerServiceCenter />} />
          <Route path="/Second_Project/inquiry" element={<CustomerProblemSubmit />} />
          <Route path="/Second_Project/admin" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminPage/></ProtectedRoute>}/>
          <Route path="/Second_Project/inquiries/:id" element={<InquiryDetail />} />
          <Route path="/Second_Project/reset-password" element={<ResetPasswordPage />} />
          <Route path="/Second_Project/403" element={<ErrorEvent403 />} />
          <Route path="/Second_Project/*" element={<ErrorEvent />} />
        </Routes>
      </WebSocketProvider>
    </Router>
  );
}

export default App;