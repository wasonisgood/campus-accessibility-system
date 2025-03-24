import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = ({ universities }) => {
  return (
    <div className="home-container">
      <section className="hero">
        <h1>校園無障礙設施登錄系統</h1>
        <p>幫助建立更加無障礙的校園環境，讓每一位同學都能自由地學習和生活</p>
        <Link to="/register" className="start-btn" aria-label="開始登錄無障礙設施資訊">
          開始登錄
        </Link>
      </section>

      <section className="info-section">
        <h2>為什麼需要您的幫助？</h2>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">🏫</div>
            <h3>提高校園可訪問性</h3>
            <p>您的貢獻將幫助行動不便的學生更好地瞭解校園環境</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h3>數據驅動改進</h3>
            <p>幫助學校了解需要改進的地方，優先解決無障礙設施問題</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🤝</div>
            <h3>共建包容社區</h3>
            <p>每一次登錄都是邁向更包容校園的一步</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>如何操作？</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>選擇大學</h3>
            <p>輸入大學資訊或從已有列表中選擇</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>添加建築物</h3>
            <p>提供建築物的基本資訊，如類型、樓層和電梯情況</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>登記無障礙設施</h3>
            <p>詳細記錄無障礙廁所等設施的具體情況</p>
          </div>
        </div>
      </section>

      {universities.length > 0 && (
        <section className="universities-section">
          <h2>已登記的大學</h2>
          <div className="universities-list">
            {universities.map((university) => (
              <div key={university.id} className="university-card">
                <h3>{university.name}</h3>
                <p>{university.address}</p>
                <Link to={`/university/${university.id}`} className="view-link">
                  查看詳情
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;