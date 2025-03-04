import React from 'react';
import { Link } from 'react-router-dom';
import './SuccessPage.css';

const SuccessPage = ({ universityName, buildingName }) => {
  return (
    <div className="success-container">
      <div className="success-icon">✓</div>
      <h2>登記成功！</h2>
      <p className="success-message">
        感謝您為提高校園無障礙環境做出的貢獻！
      </p>
      <div className="submission-details">
        <h3>您已成功提交以下信息：</h3>
        <p><strong>大學：</strong> {universityName}</p>
        <p><strong>建築物：</strong> {buildingName}</p>
      </div>
      <p className="impact-message">
        您的貢獻將幫助行動不便的同學更好地了解校園環境，讓他們能夠自由地學習和生活。
      </p>
      <div className="action-buttons">
        <Link to="/" className="btn-primary">
          返回首頁
        </Link>
        <Link to="/register" className="btn-secondary">
          登記另一個建築物
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;