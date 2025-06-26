import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './pages/login/LoginForm';
import MainPage from './pages/MainPage';
import KakaoCallback from './pages/login/KakaoCallback';
import ServerSelect from './pages/login/ServerSelect';
import SignUp from './pages/login/SignUp';
import FindId from './pages/login/FindId';
import FindPw from './pages/login/FindPw';

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
