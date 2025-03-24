// src/App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth, anonymousSignIn } from './firebase/firebase';
// 導入編輯組件
import EditUniversity from './pages/EditUniversity';
import EditBuilding from './pages/EditBuilding';
import EditBathroom from './pages/EditBathroom';

// 頁面和組件
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Register from './pages/Register';
import UniversityDetail from './pages/UniversityDetail';
import BuildingDetail from './pages/BuildingDetail';
import AboutUs from './pages/AboutUs';
import AnalyticsDashboard from './pages/AnalyticsDashboard'

import './App.css';

// 載入動畫組件
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner">
      <div className="spinner-circle"></div>
      <div className="spinner-circle inner"></div>
    </div>
    <p className="loading-text">初始化應用中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
  </div>
);

// 錯誤顯示組件
const ErrorDisplay = ({ message }) => (
  <div className="error-container" role="alert">
    <div className="error-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h2>連接錯誤</h2>
    <p>{message}</p>
    <p>請確認您的網絡連接或稍後再試。</p>
    <button 
      className="retry-button"
      onClick={() => window.location.reload()}
    >
      重試
    </button>
  </div>
);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  // 匿名登入 Firebase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await anonymousSignIn();
        // 添加一個短暫延遲使過渡更平滑
        setTimeout(() => {
          setIsInitializing(false);
          // 內容載入完成後淡入
          setTimeout(() => setFadeIn(true), 100);
        }, 800);
      } catch (error) {
        console.error("初始化錯誤:", error);
        setError("無法連接到服務，請稍後再試。");
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  if (isInitializing) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <Router>
      <div className={`app ${fadeIn ? 'fade-in' : ''}`}>
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/university/:id" element={<UniversityDetail />} />
            <Route path="/building/:id" element={<BuildingDetail />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/analyticsdashboard" element={<AnalyticsDashboard />} />

            {/* 編輯路由 */}
            <Route path="/edit/university/:id" element={<EditUniversity />} />
            <Route path="/edit/building/:id" element={<EditBuilding />} />
            <Route path="/edit/bathroom/:id" element={<EditBathroom />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;