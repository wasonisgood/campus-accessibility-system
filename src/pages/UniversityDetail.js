// src/pages/UniversityDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, collection, getDocs, query, where, doc, getDoc } from '../firebase/firebase';
import './UniversityDetail.css';

const UniversityDetail = () => {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 搜尋和視圖狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'

  useEffect(() => {
    const fetchUniversityData = async () => {
      setLoading(true);
      try {
        // 從 Firestore 獲取大學數據
        const universityRef = doc(db, 'universities', id);
        const universityDoc = await getDoc(universityRef);
        
        if (!universityDoc.exists()) {
          setError('找不到該大學的資訊');
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
        setFilteredBuildings(buildingsList);
      } catch (error) {
        console.error('Error fetching university data:', error);
        setError('獲取大學資訊時發生錯誤，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityData();
  }, [id]);

  // 搜尋建築物
  useEffect(() => {
    if (!buildings.length) return;
    
    let result = [...buildings];
    
    // 搜尋過濾
    if (searchTerm.trim()) {
      result = result.filter(building => 
        building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (building.description && building.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredBuildings(result);
  }, [searchTerm, buildings]);

  // 獲取建築物類型分佈
  const getBuildingTypes = () => {
    const types = {};
    
    buildings.forEach(building => {
      if (!types[building.type]) {
        types[building.type] = 0;
      }
      types[building.type]++;
    });
    
    return types;
  };

  // 獲取建築物類型的中文標籤
  const getBuildingTypeLabel = (type) => {
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
  };

  // 獲取建築物類型的標籤顏色
  const getBuildingTypeColor = (type) => {
    const typeColors = {
      'dormitory': '#4F46E5', // 紫色
      'cafeteria': '#16A34A', // 綠色
      'venue': '#EA580C',    // 橙色
      'academic': '#0891B2', // 青色
      'office': '#9333EA',   // 紫色
      'library': '#2563EB',  // 藍色
      'other': '#71717A'     // 灰色
    };
    return typeColors[type] || '#71717A';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-circle inner"></div>
        </div>
        <p className="loading-text">載入大學資訊中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" role="alert">
        <div className="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
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
        <p>無法找到ID為 {id} 的大學資訊</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  const buildingTypes = getBuildingTypes();
  
  return (
    <div className="university-detail-container">
      <div className="university-header">
        <div className="university-banner">
          <h1>{university.name}</h1>
          <p className="university-address">{university.address}</p>
        </div>
        
        <div className="action-buttons">
          <Link to="/register" className="btn-primary">
            添加新建築
          </Link>
          <Link to={`/edit/university/${id}`} className="btn-secondary">
            編輯大學資訊
          </Link>
        </div>
      </div>

      <div className="university-info">
        <h2>無障礙設施概況</h2>
        <p>此頁面顯示 {university.name} 的無障礙設施資訊。</p>
      </div>

      {buildings.length > 0 ? (
        <div className="buildings-section">
          <div className="buildings-toolbar">
            <div className="search-container">
              <input
                type="text"
                placeholder="搜尋建築物..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search" 
                  onClick={() => setSearchTerm('')}
                  aria-label="清除搜尋"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} 
                onClick={() => setViewMode('list')}
                aria-label="列表檢視"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M3 13h18v-2H3v2zm0 7h18v-2H3v2zm0-12h18V6H3v2z" />
                </svg>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} 
                onClick={() => setViewMode('table')}
                aria-label="表格檢視"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="building-summary">
            <div className="building-types-summary">
              {Object.entries(buildingTypes).map(([type, count]) => (
                <div key={type} className="building-type-item">
                  <span 
                    className="building-type-badge" 
                    style={{backgroundColor: getBuildingTypeColor(type)}}
                  >
                    {getBuildingTypeLabel(type)}
                  </span>
                  <span className="building-type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="buildings-count">
            顯示 {filteredBuildings.length} 個建築物 {searchTerm && `(搜尋: "${searchTerm}")`}
          </div>
          
          {filteredBuildings.length === 0 ? (
            <div className="no-results">
              <p>沒有找到符合條件的建築物</p>
              {searchTerm && (
                <button 
                  className="btn-text" 
                  onClick={() => setSearchTerm('')}
                >
                  清除搜尋
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className="buildings-list">
              {filteredBuildings.map(building => (
                <div key={building.id} className="building-list-item">
                  <div className="building-list-content">
                    <div className="building-list-header">
                      <h3>{building.name}</h3>
                      <span 
                        className="building-type-badge" 
                        style={{backgroundColor: getBuildingTypeColor(building.type)}}
                      >
                        {getBuildingTypeLabel(building.type)}
                      </span>
                    </div>
                    <div className="building-list-info">
                      <div className="info-item">
                        <span className="info-label">樓層數:</span> {building.floors}
                      </div>
                      <div className="info-item">
                        <span className="info-label">電梯:</span> {building.hasElevator ? '有' : '無'}
                      </div>
                      {building.description && (
                        <div className="building-description">
                          {building.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="building-list-actions">
                    <Link to={`/building/${building.id}`} className="btn-view">
                      查看詳情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="buildings-table-container">
              <table className="buildings-table">
                <thead>
                  <tr>
                    <th>建築名稱</th>
                    <th>類型</th>
                    <th>樓層數</th>
                    <th>電梯</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuildings.map(building => (
                    <tr key={building.id}>
                      <td>{building.name}</td>
                      <td>
                        <span 
                          className="building-type-badge small" 
                          style={{backgroundColor: getBuildingTypeColor(building.type)}}
                        >
                          {getBuildingTypeLabel(building.type)}
                        </span>
                      </td>
                      <td>{building.floors}</td>
                      <td>{building.hasElevator ? '有' : '無'}</td>
                      <td>
                        <Link to={`/building/${building.id}`} className="btn-view small">
                          查看詳情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="no-buildings">
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" width="64" height="64">
              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
            </svg>
            <h3>此大學尚未登記任何建築物的無障礙設施</h3>
            <p>添加第一個建築物以開始登記無障礙設施資訊</p>
            <Link to="/register" className="btn-primary">
              添加第一個建築
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityDetail;