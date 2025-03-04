// src/pages/AboutUs.js

import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <section className="about-header">
        <h1>關於我們</h1>
        <p className="subtitle">致力於建設無障礙校園環境</p>
      </section>

      <section className="about-section">
        <h2>人權部簡介</h2>
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
      </section>

      <section className="about-section">
        <h2>我們的使命</h2>
        <div className="mission-cards">
          <div className="mission-card">
            <div className="mission-icon">🔍</div>
            <h3>發現問題</h3>
            <p>全面調查和記錄校園內各類建築物的無障礙設施狀況，找出存在的問題和不足。</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">📊</div>
            <h3>數據分析</h3>
            <p>通過數據收集和分析，提供校園無障礙設施的整體情況，為改進工作提供科學依據。</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">📢</div>
            <h3>倡導改變</h3>
            <p>向學校管理部門提出具體的改進建議，推動無障礙設施的優化和完善。</p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">🤝</div>
            <h3>共建共享</h3>
            <p>促進校園內對無障礙環境的認識和關注，形成全員參與的共建共享氛圍。</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>系統緣起</h2>
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
            <div className="placeholder-image">
              <span>校園無障礙調查活動照片</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section team-section">
        <h2>核心團隊</h2>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">
              <span>P</span>
            </div>
            <h3>劉平權</h3>
            <p className="member-role">人權部部長</p>
            <p className="member-desc">
              負責項目總體規劃和資源協調，推動無障礙理念在校園的傳播和實踐。
            </p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <span>A</span>
            </div>
            <h3>張無礙</h3>
            <p className="member-role">項目主管</p>
            <p className="member-desc">
              統籌系統開發和實施，協調各方資源，確保項目順利進行。
            </p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <span>D</span>
            </div>
            <h3>王數據</h3>
            <p className="member-role">數據分析師</p>
            <p className="member-desc">
              負責系統數據的收集、整理和分析，為改進工作提供數據支持。
            </p>
          </div>
          <div className="team-member">
            <div className="member-avatar">
              <span>T</span>
            </div>
            <h3>李技術</h3>
            <p className="member-role">技術開發</p>
            <p className="member-desc">
              負責系統的設計和開發，確保系統的可用性和穩定性。
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>合作與支持</h2>
        <p>
          本項目得到了學校管理層、學生會、資訊科技中心、校園規劃處等多個部門的大力支持。
          同時，我們也與校外多個身心障礙權益組織保持密切合作，共同推動校園無障礙環境建設。
        </p>
        <div className="partners-grid">
          <div className="partner-logo">學生會</div>
          <div className="partner-logo">資訊科技中心</div>
          <div className="partner-logo">校園規劃處</div>
          <div className="partner-logo">無障礙環境促進會</div>
          <div className="partner-logo">身心障礙權益聯盟</div>
          <div className="partner-logo">通用設計協會</div>
        </div>
      </section>

      <section className="about-section">
        <h2>加入我們</h2>
        <p>
          我們誠摯邀請所有關心校園無障礙環境的師生加入我們的行列，一起為建設更加包容、
          友善的校園環境貢獻力量。您可以通過以下方式參與：
        </p>
        <div className="join-cards">
          <div className="join-card">
            <h3>登錄設施信息</h3>
            <p>
              通過本系統登錄校園內的建築物和無障礙設施信息，為數據庫的完善做出貢獻。
            </p>
            <Link to="/register" className="join-link">開始登錄 →</Link>
          </div>
          <div className="join-card">
            <h3>反饋問題與建議</h3>
            <p>
              如果您發現系統存在問題，或有任何改進建議，歡迎隨時向我們反饋。
            </p>
            <a href="mailto:accessibility@school.edu" className="join-link">聯繫我們 →</a>
          </div>
          <div className="join-card">
            <h3>參與志願活動</h3>
            <p>
              定期參加我們組織的校園無障礙設施調查活動，親身體驗並記錄校園環境。
            </p>
            <a href="#volunteer" className="join-link">了解更多 →</a>
          </div>
        </div>
      </section>

      <section className="about-section contact-section">
        <h2>聯繫我們</h2>
        <div className="contact-info">
          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <div className="contact-detail">
              <h3>電子郵件</h3>
              <p>accessibility@school.edu</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <div className="contact-detail">
              <h3>電話</h3>
              <p>(02) 1234-5678</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div className="contact-detail">
              <h3>辦公室</h3>
              <p>學生活動中心 2樓 208室</p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">🕙</div>
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