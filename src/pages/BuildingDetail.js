// src/pages/BuildingDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, collection, getDocs, query, where, doc, getDoc } from '../firebase/firebase';
import './BuildingDetail.css';

const BuildingDetail = () => {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [university, setUniversity] = useState(null);
  const [bathroom, setBathroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBuildingData = async () => {
      setLoading(true);
      try {
        // 獲取建築物數據
        const buildingRef = doc(db, 'buildings', id);
        const buildingDoc = await getDoc(buildingRef);
        
        if (!buildingDoc.exists()) {
          setError('找不到該建築物的信息');
          setLoading(false);
          return;
        }
        
        const buildingData = { id: buildingDoc.id, ...buildingDoc.data() };
        setBuilding(buildingData);
        
        // 獲取大學數據
        if (buildingData.universityId) {
          const universityRef = doc(db, 'universities', buildingData.universityId);
          const universityDoc = await getDoc(universityRef);
          if (universityDoc.exists()) {
            setUniversity({ id: universityDoc.id, ...universityDoc.data() });
          }
        }
        
        // 獲取衛生間數據
        const bathroomsQuery = query(
          collection(db, 'bathrooms'), 
          where('buildingId', '==', id)
        );
        
        const bathroomsSnapshot = await getDocs(bathroomsQuery);
        
        if (!bathroomsSnapshot.empty) {
          const bathroomDoc = bathroomsSnapshot.docs[0];
          setBathroom({ id: bathroomDoc.id, ...bathroomDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching building data:', error);
        setError('獲取建築物信息時發生錯誤，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingData();
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

  if (!building) {
    return (
      <div className="building-not-found">
        <h2>找不到該建築物</h2>
        <p>無法找到ID為 {id} 的建築物信息</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="building-detail-container">
      <div className="building-header">
        <h1>{building.name}</h1>
        <div className="building-type-badge">
          {getBuildingTypeLabel(building.type)}
        </div>
        {university && (
          <p className="university-link">
            位於 <Link to={`/university/${university.id}`}>{university.name}</Link>
          </p>
        )}
      </div>
       
      <div className="building-info-card">
        <h2>建築物信息</h2>
        <Link to={`/edit/building/${id}`} className="btn-secondary btn-sm">
      編輯
    </Link>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">樓層數</span>
            <span className="info-value">{building.floors}</span>
          </div>
          <div className="info-item">
            <span className="info-label">電梯</span>
            <span className="info-value">{building.hasElevator ? '有' : '無'}</span>
          </div>
          {building.description && (
            <div className="info-item full-width">
              <span className="info-label">簡介</span>
              <p className="info-value description">{building.description}</p>
            </div>
          )}
        </div>
      </div>

      {bathroom ? (
        <div className="bathroom-section">
          <h2>無障礙廁所</h2>
          <Link to={`/edit/bathroom/${id}`} className="btn-secondary btn-sm">
      編輯
    </Link>
          {bathroom.hasAccessibleBathroom ? (
            <div className="bathroom-info">
              <div className="bathroom-status positive">
                此建築物有無障礙廁所
              </div>
              
              <h3>樓層分佈</h3>
              <div className="floors-grid">
                {bathroom.floors && bathroom.floors.map((floor, index) => (
                  <div key={index} className={`floor-card ${floor.hasAccessible ? 'has-accessible' : 'no-accessible'}`}>
                    <h4>{index + 1} 樓</h4>
                    {floor.hasAccessible ? (
                      <div className="floor-accessible-info">
                        <div className="status-badge positive">有無障礙廁所</div>
                        
                        {floor.features && (
                          <div className="features-list">
                            <div className="feature-item">
                              <span className="feature-label">扶手:</span>
                              <span className="feature-value">
                                {floor.features.handrails?.exists ? '有' : '無'}
                                {floor.features.handrails?.exists && floor.features.handrails?.properHeight && 
                                 ' (高度合適)'}
                              </span>
                            </div>
                            
                            <div className="feature-item">
                              <span className="feature-label">洗手台:</span>
                              <span className="feature-value">
                                {floor.features.sink?.exists ? '有' : '無'}
                                {floor.features.sink?.exists && floor.features.sink?.accessible && 
                                 ' (適合輪椅使用)'}
                              </span>
                            </div>
                            
                            <div className="feature-item">
                              <span className="feature-label">門寬:</span>
                              <span className="feature-value">
                                {floor.features.doorWidth?.adequate ? 
                                 '足夠輪椅通過' : '不足以通過輪椅'}
                              </span>
                            </div>
                            
                            <div className="feature-item">
                              <span className="feature-label">門鎖:</span>
                              <span className="feature-value">
                                {floor.features.doorLock?.functional ? 
                                 '易於操作' : '操作困難'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="status-badge negative">無無障礙廁所</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bathroom-status negative">
              此建築物沒有無障礙廁所
            </div>
          )}
        </div>
      ) : (
        <div className="no-bathroom-data">
          <p>尚未登記此建築物的無障礙廁所信息</p>
          <Link to="/register" className="btn-primary">
            添加無障礙廁所信息
          </Link>
        </div>
      )}

      <div className="action-buttons">
        <Link to={university ? `/university/${university.id}` : '/'} className="btn-secondary">
          返回
        </Link>
      </div>
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

export default BuildingDetail;