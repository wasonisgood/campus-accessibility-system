import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section about">
          <h4>關於本系統</h4>
          <p>
            校園無障礙登錄系統旨在收集和分享大學校園的無障礙設施資訊，
            幫助行動不便的同學更好地了解和使用校園設施。
          </p>
        </div>
        
        <div className="footer-section contact">
          <h4>聯繫我們</h4>
          <p>
            如果您有任何問題、建議或意見，請通過以下方式聯繫我們：
          </p>
          <p>
            <a href="mailto:contact@campus-accessibility.org" aria-label="發送電子郵件給我們">
              contact@campus-accessibility.org
            </a>
          </p>
        </div>
        
        <div className="footer-section links">
          <h4>快速鏈接</h4>
          <ul>
            <li><a href="/" aria-label="回到首頁">首頁</a></li>
            <li><a href="/register" aria-label="登錄新的無障礙設施">新增登錄</a></li>
            <li><a href="/about" aria-label="了解更多關於我們的資訊">關於我們</a></li>
            <li><a href="/privacy" aria-label="閱讀我們的隱私政策">隱私政策</a></li>
          </ul>
        </div>
      </div>
      
      <div className="copyright">
        <p>&copy; {currentYear} 校園無障礙登錄系統 - 讓每一位同學都能自由地學習和生活</p>
      </div>
    </footer>
  );
};

export default Footer;