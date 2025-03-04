// src/pages/UniversityDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, collection, getDocs, query, where, doc, getDoc } from '../firebase/firebase';
import './UniversityDetail.css';

const UniversityDetail = () => {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniversityData = async () => {
      setLoading(true);
      try {
        // 從 Firestore 獲取大學數據
        const universityRef = doc(db, 'universities', id);
        const universityDoc = await getDoc(universityRef);
        
        if (!universityDoc.exists()) {
          setError('找不到該大學的信息');
          setLoading(false);
          return;
        }
        
        // 設置大學數據
        setUniversity({ id: universityDoc.id, ...universityDoc.data() });
        
        // 獲取該大學的所有建築物
        const buildingsQuery = query(
          collection(db, 'buildings'), 
          where('universityId', '==', id)
        );
        
        const buildingsSnapshot = await getDocs(buildingsQuery);
        
        const buildingsList = [];
        buildingsSnapshot.forEach(doc => {
          buildingsList.push({ id: doc.id, ...doc.data() });
        });
        
        setBuildings(buildingsList);
      } catch (error) {
        console.error('Error fetching university data:', error);
        setError('獲取大學信息時發生錯誤，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityData();
  }, [id]);

  if (loading) {
    return <div className="loading-container">載入中...</div>;
  }

  if (error) {
    return (
      <div className="error-container" role="alert">
        <p>{error}</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  // 如果沒有找到大學數據
  if (!university) {
    return (
      <div className="university-not-found">
        <h2>找不到該大學</h2>
        <p>無法找到ID為 {id} 的大學信息</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="university-detail-container">
      <div className="university-header">
        <h1>{university.name}</h1>
        <p className="university-address">{university.address}</p>
      </div>

      <div className="university-info">
        <h2>無障礙設施概況</h2>
        <p>此頁面顯示 {university.name} 的無障礙設施信息。</p>
        
        <div className="action-buttons">
        <Link to="/register" className="btn-primary">
      添加新建築
    </Link>
    <Link to={`/edit/university/${id}`} className="btn-secondary">
      編輯大學信息
    </Link>
        </div>
      </div>

      {buildings.length > 0 ? (
        <div className="buildings-section">
          <h2>已登記建築物 ({buildings.length})</h2>
          <div className="buildings-grid">
            {buildings.map(building => (
              <div key={building.id} className="building-card">
                <h3>{building.name}</h3>
                <div className="building-type">
                  {getBuildingTypeLabel(building.type)}
                </div>
                <div className="building-info">
                  <p>樓層數: {building.floors}</p>
                  <p>電梯: {building.hasElevator ? '有' : '無'}</p>
                </div>
                <Link to={`/building/${building.id}`} className="view-building-link">
                  查看詳情
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-buildings">
          <p>此大學尚未登記任何建築物的無障礙設施</p>
          <Link to="/register" className="btn-primary">
            添加第一個建築
          </Link>
        </div>
      )}
    </div>
  );
};

// 獲取建築物類型的中文標籤
function getBuildingTypeLabel(type) {
  const typeLabels = {
    'dormitory': '宿舍',
    'cafeteria': '餐廳',
    'venue': '大型場館',
    'academic': '教學大樓',
    'office': '辦公大樓',
    'library': '圖書館',
    'other': '其他'
  };
  return typeLabels[type] || '未知類型';
}

export default UniversityDetail;