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


import './App.css';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  // 匿名登入 Firebase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await anonymousSignIn();
        setIsInitializing(false);
      } catch (error) {
        console.error("初始化錯誤:", error);
        setError("無法連接到服務，請稍後再試。");
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  if (isInitializing) {
    return <div className="loading-container">初始化應用中...</div>;
  }

  if (error) {
    return (
      <div className="error-container" role="alert">
        <h2>連接錯誤</h2>
        <p>{error}</p>
        <p>請確認您的網絡連接或稍後再試。</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/university/:id" element={<UniversityDetail />} />
            <Route path="/building/:id" element={<BuildingDetail />} />
            <Route path="/about" element={<AboutUs />} /> {/* 添加關於我們路由 */}

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