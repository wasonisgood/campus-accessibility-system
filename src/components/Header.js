import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" aria-label="回到首頁">
            <span className="logo-icon">♿</span>
            <span className="logo-text">校園無障礙登錄系統</span>
          </Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li>
              <Link to="/">首頁</Link>
            </li>
            <li>
              <Link to="/register">新增登錄</Link>
            </li>
            <li>
              <Link to="/about" aria-label="了解我們的使命">關於我們</Link>
            </li>
            <li>
              <Link to="/analyticsdashboard" aria-label="資料視覺化">資料視覺化</Link>
            </li>
          </ul>
        </nav>
        <div className="accessibility-control">
          <button 
            className="high-contrast-toggle" 
            aria-label="切換高對比度模式"
            onClick={() => document.body.classList.toggle('high-contrast')}
          >
            高對比度
          </button>
          <button 
            className="font-size-increase" 
            aria-label="增加字體大小"
            onClick={() => document.body.classList.toggle('large-font')}
          >
            放大字體
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;