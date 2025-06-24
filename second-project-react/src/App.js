import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/login/LoginForm';
import MainPage from './pages/MainPage';
import './App.css';
import ExamOMRViewer from './components/Test';
import KakaoCallback from './components/login/KakaoCallback';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/kakao/callback" element={<KakaoCallback />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;
