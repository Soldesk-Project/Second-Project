import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/login/LoginForm';
import MainPage from './pages/MainPage';
import './App.css';
import KakaoCallback from './components/login/KakaoCallback';
import ServerSelect from './components/login/ServerSelect';
import SignUp from './components/login/SignUp';
import FindId from './components/login/FindId';
import FindPw from './components/login/FindPw';

function App() {
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
      </Routes>
    </Router>
  );
}

export default App;
