// src/pages/AboutUs.js

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  // 加入滾動動畫效果
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(elem => {
      observer.observe(elem);
    });

    return () => {
      document.querySelectorAll('.animate-on-scroll').forEach(elem => {
        observer.unobserve(elem);
      });
    };
  }, []);

  return (
    <div className="about-us-container">
      <section className="about-header animate-on-scroll">
        <div className="header-content">
          <h1>關於我們</h1>
          <p className="subtitle">致力於建設無障礙校園環境</p>
          <div className="header-decoration"></div>
        </div>
      </section>

      <section className="about-section animate-on-scroll">
        <div className="section-header">
          <h2>人權部簡介</h2>
          <div className="section-underline"></div>
        </div>
        <div className="section-content">
          <p>
            校園無障礙設施登錄系統是由人權部發起並推動的重要項目，旨在推動校園內無障礙環境的建設，
            保障身心障礙學生的平等受教權和生活權。人權部作為學生自治組織的重要部門，長期關注校園內的
            人權議題，致力於創造一個平等、尊重、包容的校園環境。
          </p>
          <p>
            我們相信，無障礙環境不僅是身心障礙者的需求，更是整個社會進步和文明的體現。通過這個系統，
            我們希望能夠匯集全校師生的力量，共同發現和改善校園中的無障礙設施，讓每一位學生都能自由、
            平等地享受校園生活。
          </p>
        </div>
      </section>

      <section className="about-section mission-section animate-on-scroll">
        <div className="section-header">
          <h2>我們的使命</h2>
          <div className="section-underline"></div>
        </div>
        <div className="mission-cards">
          <div className="mission-card">
            <div className="mission-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3>發現問題</h3>
            <p>全面調查和記錄校園內各類建築物的無障礙設施狀況，找出存在的問題和不足。</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </div>
            <h3>數據分析</h3>
            <p>通過數據收集和分析，提供校園無障礙設施的整體情況，為改進工作提供科學依據。</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </div>
            <h3>倡導改變</h3>
            <p>向學校管理部門提出具體的改進建議，推動無障礙設施的優化和完善。</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>共建共享</h3>
            <p>促進校園內對無障礙環境的認識和關注，形成全員參與的共建共享氛圍。</p>
          </div>
        </div>
      </section>

      <section className="about-section origin-section animate-on-scroll">
        <div className="section-header">
          <h2>系統緣起</h2>
          <div className="section-underline"></div>
        </div>
        <div className="origin-content">
          <div className="origin-text">
            <p>
              本系統源於2024年人權部發起的「無障礙校園環境調查計劃」。在調查過程中，我們發現校園內的
              無障礙設施存在分布不均、標識不清、維護不足等問題，許多身心障礙學生在校園生活中面臨諸多不便。
            </p>
            <p>
              為了系統性解決這些問題，我們決定開發這套校園無障礙設施登錄系統，希望通過技術手段，
              匯集眾人之力，全面記錄和改善校園無障礙環境。系統於2025年3月正式上線，得到了學校
              師生的廣泛支持和參與。
            </p>
            <p>
              我們相信，隨著越來越多的人加入到這項工作中來，我們的校園將變得更加友善、包容和無障礙。
            </p>
          </div>
          <div className="origin-image">
            <div className="origin-img-container">
              <div className="placeholder-image">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>校園無障礙調查活動照片</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section team-section animate-on-scroll">
        <div className="section-header">
          <h2>核心團隊</h2>
          <div className="section-underline"></div>
        </div>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">
              <span>彭</span>
            </div>
            <h3>彭威翔</h3>
            <p className="member-role">人權部部長</p>
            <p className="member-desc">
              負責項目總體規劃和資源協調，推動無障礙理念在校園的傳播和實踐。同時擔任系統的技術開發負責人。
            </p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <span>沈</span>
            </div>
            <h3>沈利倩</h3>
            <p className="member-role">項目主管</p>
            <p className="member-desc">
              統籌系統開發和實施，協調各方資源，確保項目順利進行。
            </p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <span>徐</span>
            </div>
            <h3>徐偉佑</h3>
            <p className="member-role">數據分析師</p>
            <p className="member-desc">
              負責系統數據的收集、整理和分析，為改進工作提供數據支持。
            </p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <span>陳</span>
            </div>
            <h3>陳可冀</h3>
            <p className="member-role">調查組組長</p>
            <p className="member-desc">
              負責組織和協調校園無障礙設施的實地調查工作，以及志願者團隊的培訓和管理。
            </p>
          </div>
        </div>
      </section>

      <section className="about-section partners-section animate-on-scroll">
        <div className="section-header">
          <h2>合作與支持</h2>
          <div className="section-underline"></div>
        </div>
        <p>
          本項目得到了學校管理層、學生會、資訊科技中心、校園規劃處等多個部門的大力支持。
          同時，我們也與校外多個身心障礙權益組織保持密切合作，共同推動校園無障礙環境建設。
        </p>
        <div className="partners-grid">
          <div className="partner-logo">
            <div className="logo-container">
              <span>學生會</span>
            </div>
          </div>
          <div className="partner-logo">
            <div className="logo-container">
              <span>資訊科技中心</span>
            </div>
          </div>
          <div className="partner-logo">
            <div className="logo-container">
              <span>校園規劃處</span>
            </div>
          </div>
          <div className="partner-logo">
            <div className="logo-container">
              <span>無障礙環境促進會</span>
            </div>
          </div>
          <div className="partner-logo">
            <div className="logo-container">
              <span>身心障礙權益聯盟</span>
            </div>
          </div>
          <div className="partner-logo">
            <div className="logo-container">
              <span>通用設計協會</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section join-section animate-on-scroll">
        <div className="section-header">
          <h2>加入我們</h2>
          <div className="section-underline"></div>
        </div>
        <p className="join-intro">
          我們誠摯邀請所有關心校園無障礙環境的師生加入我們的行列，一起為建設更加包容、
          友善的校園環境貢獻力量。您可以通過以下方式參與：
        </p>
        <div className="join-cards">
          <div className="join-card">
            <h3>登錄設施資訊</h3>
            <p>
              通過本系統登錄校園內的建築物和無障礙設施資訊，為數據庫的完善做出貢獻。
            </p>
            <Link to="/register" className="join-link">
              開始登錄
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
          <div className="join-card">
            <h3>反饋問題與建議</h3>
            <p>
              如果您發現系統存在問題，或有任何改進建議，歡迎隨時向我們反饋。
            </p>
            <a href="mailto:accessibility@school.edu" className="join-link">
              聯繫我們
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
          <div className="join-card">
            <h3>參與志願活動</h3>
            <p>
              定期參加我們組織的校園無障礙設施調查活動，親身體驗並記錄校園環境。
            </p>
            <a href="#volunteer" className="join-link">
              了解更多
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section className="about-section contact-section animate-on-scroll">
        <div className="section-header">
          <h2>聯繫我們</h2>
          <div className="section-underline"></div>
        </div>
        <div className="contact-info">
          <div className="contact-item">
            <div className="contact-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div className="contact-detail">
              <h3>電子郵件</h3>
              <p>accessibility@school.edu</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div className="contact-detail">
              <h3>電話</h3>
              <p>(02) 1234-5678</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="contact-detail">
              <h3>辦公室</h3>
              <p>學生活動中心 2樓 208室</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="contact-detail">
              <h3>辦公時間</h3>
              <p>週一至週五 10:00-17:00</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;