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
  const [expandedFloor, setExpandedFloor] = useState(null);
  const [activeTab, setActiveTab] = useState({});

  useEffect(() => {
    const fetchBuildingData = async () => {
      setLoading(true);
      try {
        // 獲取建築物數據
        const buildingRef = doc(db, 'buildings', id);
        const buildingDoc = await getDoc(buildingRef);
        
        if (!buildingDoc.exists()) {
          setError('找不到該建築物的資訊');
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
        
        // 獲取廁所數據
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
        setError('獲取建築物資訊時發生錯誤，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingData();
  }, [id]);

  // 處理樓層展開與收合
  const toggleFloorExpansion = (floorIndex) => {
    setExpandedFloor(expandedFloor === floorIndex ? null : floorIndex);
  };

  // 處理分類標籤切換
  const toggleTab = (floorIndex, tabName) => {
    setActiveTab(prev => ({
      ...prev,
      [floorIndex]: prev[floorIndex] === tabName ? null : tabName
    }));
  };

  // 檢查是否有缺少照片的問題
  const checkMissingPhotos = (floor) => {
    if (!floor.features) return false;
    
    // 檢查各種可能需要照片的問題
    const hasIssues = (
      (!floor.features.doorWidth?.adequate) ||
      (!floor.features.innerSpace?.adequate) ||
      (!floor.features.doorLock?.functional) ||
      (!floor.features.toilet?.properHeight) ||
      (!floor.features.handrails?.exists) ||
      (!floor.features.sink?.exists || !floor.features.sink?.accessible) ||
      (!floor.features.emergencyCall?.exists) ||
      (!floor.features.floor?.nonSlip) ||
      (!floor.features.threshold?.none && !floor.features.threshold?.hasRamp) ||
      (!floor.features.pathway?.adequate) ||
      (!floor.features.signage?.clear) ||
      (!floor.features.lighting?.adequate) ||
      (floor.features.issues?.usedAsStorage) ||
      (floor.features.issues?.needsRenovation) ||
      (floor.features.issues?.otherIssues) ||
      (floor.features.toiletPaper?.improperPlacement) ||
      (floor.features.rotationSpace?.insufficient)
    );
    
    // 檢查是否有上傳照片
    const hasPhotos = floor.photos && Object.keys(floor.photos).length > 0;
    
    return hasIssues && !hasPhotos;
  };

  // 获取樓層的問題統計
  const getFloorIssueStats = (floor) => {
    if (!floor.features) return { total: 0, categories: {} };
    
    const issues = {
      total: 0,
      categories: {
        critical: 0,
        major: 0,
        moderate: 0,
        minor: 0
      }
    };
    
    // 嚴重問題 (critical)
    if (floor.features.issues?.usedAsStorage) {
      issues.total++;
      issues.categories.critical++;
    }
    
    if (floor.features.issues?.needsRenovation) {
      issues.total++;
      issues.categories.critical++;
    }
    
    if (floor.features.issues?.otherIssues) {
      issues.total++;
      issues.categories.critical++;
    }
    
    // 重大問題 (major)
    if (!floor.features.doorWidth?.adequate) {
      issues.total++;
      issues.categories.major++;
    }
    
    if (!floor.features.innerSpace?.adequate) {
      issues.total++;
      issues.categories.major++;
    }
    
    if (!floor.features.doorLock?.functional) {
      issues.total++;
      issues.categories.major++;
    }
    
    if (!floor.features.handrails?.exists) {
      issues.total++;
      issues.categories.major++;
    }
    
    if (!floor.features.pathway?.adequate) {
      issues.total++;
      issues.categories.major++;
    }
    
    // 中等問題 (moderate)
    if (!floor.features.toilet?.properHeight) {
      issues.total++;
      issues.categories.moderate++;
    }
    
    if (!floor.features.sink?.exists || !floor.features.sink?.accessible) {
      issues.total++;
      issues.categories.moderate++;
    }
    
    if (!floor.features.emergencyCall?.exists) {
      issues.total++;
      issues.categories.moderate++;
    }
    
    if (!floor.features.threshold?.none && !floor.features.threshold?.hasRamp) {
      issues.total++;
      issues.categories.moderate++;
    }
    
    // 輕微問題 (minor)
    if (!floor.features.floor?.nonSlip) {
      issues.total++;
      issues.categories.minor++;
    }
    
    if (!floor.features.signage?.clear) {
      issues.total++;
      issues.categories.minor++;
    }
    
    if (!floor.features.lighting?.adequate) {
      issues.total++;
      issues.categories.minor++;
    }
    
    // 新增問題類型
    if (floor.features.toiletPaper?.improperPlacement) {
      issues.total++;
      issues.categories.minor++;
    }
    
    if (floor.features.rotationSpace?.insufficient) {
      issues.total++;
      issues.categories.major++;
    }
    
    return issues;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-circle inner"></div>
        </div>
        <p className="loading-text">載入建築物資訊中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
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

  if (!building) {
    return (
      <div className="building-not-found">
        <h2>找不到該建築物</h2>
        <p>無法找到ID為 {id} 的建築物資訊</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="building-detail-container">
      <div className="building-header">
        <div className="building-title-area">
          <h1>{building.name}</h1>
          <div className="building-type-badge">
            {getBuildingTypeLabel(building.type)}
          </div>
        </div>
        {university && (
          <p className="university-link">
            位於 <Link to={`/university/${university.id}`}>{university.name}</Link>
          </p>
        )}
      </div>
       
      <div className="building-info-card">
        <div className="card-header">
          <h2>建築物資訊</h2>
          <Link to={`/edit/building/${id}`} className="btn-secondary btn-sm">
            編輯
          </Link>
        </div>
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
          <div className="card-header">
            <h2>無障礙廁所</h2>
            <Link to={`/edit/bathroom/${bathroom.id}`} className="btn-secondary btn-sm">
              編輯
            </Link>
          </div>
          
          {bathroom.hasAccessibleBathroom ? (
            <div className="bathroom-info">
              <div className="bathroom-status positive">
                此建築物有無障礙廁所
              </div>
              
              <h3>樓層分佈</h3>
              <div className="floors-grid">
                {bathroom.floors && bathroom.floors.map((floor, floorIndex) => {
                  // 計算問題數量和嚴重性
                  const issueStats = getFloorIssueStats(floor);
                  const missingPhotos = checkMissingPhotos(floor);
                  
                  return (
                    <div 
                      key={floorIndex} 
                      className={`floor-card ${floor.hasAccessible ? 'has-accessible' : 'no-accessible'} ${expandedFloor === floorIndex ? 'expanded' : ''}`}
                    >
                      <div 
                        className="floor-header"
                        onClick={() => floor.hasAccessible && toggleFloorExpansion(floorIndex)}
                      >
                        <h4>{floorIndex + 1} 樓</h4>
                        {floor.hasAccessible ? (
                          <div className="floor-status">
                            <div className="status-badge positive">有無障礙廁所</div>
                            {issueStats.total > 0 && (
                              <div className={`problem-counter ${issueStats.total > 6 ? 'severe' : issueStats.total > 3 ? 'moderate' : 'minor'}`}>
                                {issueStats.total} 個問題
                              </div>
                            )}
                            {missingPhotos && (
                              <div className="missing-photos-badge">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                缺少照片
                              </div>
                            )}
                            {floor.hasAccessible && (
                              <button 
                                className="expand-toggle"
                                aria-label={expandedFloor === floorIndex ? "收起詳情" : "展開詳情"}
                              >
                                {expandedFloor === floorIndex ? '收起' : '詳情'}
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                                  <polyline points={expandedFloor === floorIndex ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="status-badge negative">無無障礙廁所</div>
                        )}
                      </div>
                      
                      {floor.hasAccessible && expandedFloor === floorIndex && (
                        <div className="floor-accessible-info">
                          {/* 問題摘要區域 */}
                          {issueStats.total > 0 && (
                            <div className="issues-summary">
                              <h5>⚠️ 問題摘要</h5>
                              <div className="issue-category-stats">
                                {issueStats.categories.critical > 0 && (
                                  <div className="issue-stat critical">
                                    <span className="issue-count">{issueStats.categories.critical}</span>
                                    <span className="issue-type">嚴重問題</span>
                                  </div>
                                )}
                                {issueStats.categories.major > 0 && (
                                  <div className="issue-stat major">
                                    <span className="issue-count">{issueStats.categories.major}</span>
                                    <span className="issue-type">主要問題</span>
                                  </div>
                                )}
                                {issueStats.categories.moderate > 0 && (
                                  <div className="issue-stat moderate">
                                    <span className="issue-count">{issueStats.categories.moderate}</span>
                                    <span className="issue-type">中度問題</span>
                                  </div>
                                )}
                                {issueStats.categories.minor > 0 && (
                                  <div className="issue-stat minor">
                                    <span className="issue-count">{issueStats.categories.minor}</span>
                                    <span className="issue-type">輕微問題</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 照片展示區域 */}
                              {floor.photos && Object.keys(floor.photos).length > 0 && (
                                <div className="floor-photos">
                                  <h5>📷 問題照片</h5>
                                  <div className="photo-gallery">
                                    {Object.entries(floor.photos).map(([issueKey, photoUrl], photoIndex) => (
                                      <div key={photoIndex} className="photo-item">
                                        <img src={photoUrl} alt={`${floorIndex+1}樓 ${getIssueLabel(issueKey)} 問題照片`} />
                                        <div className="photo-caption">{getIssueLabel(issueKey)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* 缺少照片提醒 */}
                              {missingPhotos && (
                                <div className="missing-photos-alert">
                                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                  </svg>
                                  <span>請上傳問題照片以完善記錄</span>
                                  <Link to={`/edit/bathroom/${bathroom.id}`} className="btn-sm">
                                    上傳照片
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 功能標籤頁 */}
                          {floor.features && (
                            <div className="features-list">
                              <div className="features-tabs">
                                {/* 空間與尺寸 */}
                                <div className="tab">
                                  <button 
                                    className={`tab-header ${activeTab[floorIndex] === 'space' ? 'active' : ''}`}
                                    onClick={() => toggleTab(floorIndex, 'space')}
                                  >
                                    <span className="tab-icon">🚪</span> 
                                    <span className="tab-title">空間與尺寸</span>
                                    {(!floor.features.doorWidth?.adequate || 
                                      !floor.features.innerSpace?.adequate || 
                                      !floor.features.doorLock?.functional || 
                                      floor.features.rotationSpace?.insufficient) ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </button>
                                  <div className={`tab-content ${activeTab[floorIndex] === 'space' ? 'active' : ''}`}>
                                    <div className="feature-category">                                  
                                      <div className="feature-item">
                                        <span className="feature-label">門寬:</span>
                                        <span className={`feature-value ${floor.features.doorWidth?.adequate ? 'positive' : 'negative'}`}>
                                          {floor.features.doorWidth?.adequate ? 
                                          '足夠輪椅通過' : '⚠️ 不足以通過輪椅'}
                                          {floor.features.doorWidth?.width && 
                                          ` (${floor.features.doorWidth.width}公分)`}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">開門方式:</span>
                                        <span className="feature-value">
                                          {floor.features.doorType?.value || '未標註'}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">內部迴轉空間:</span>
                                        <span className={`feature-value ${floor.features.innerSpace?.adequate ? 'positive' : 'negative'}`}>
                                          {floor.features.innerSpace?.adequate ? 
                                          '足夠輪椅迴轉' : '⚠️ 空間不足'}
                                          {floor.features.innerSpace?.dimensions && 
                                          ` (${floor.features.innerSpace.dimensions})`}
                                        </span>
                                      </div>
                                      
                                      {floor.features.rotationSpace?.insufficient && (
                                        <div className="feature-item">
                                          <span className="feature-label">旋轉空間不足:</span>
                                          <span className="feature-value negative">
                                            ⚠️ 不足 1.5 公尺
                                            {floor.features.rotationSpace?.difference && 
                                            ` (差距約 ${floor.features.rotationSpace.difference} 公分)`}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">門把及鎖:</span>
                                        <span className={`feature-value ${floor.features.doorLock?.functional ? 'positive' : 'negative'}`}>
                                          {floor.features.doorLock?.functional ? 
                                          '易於操作' : '⚠️ 操作困難'}
                                          {floor.features.doorLock?.hasEmergencyUnlock && 
                                          ' (有緊急解鎖功能)'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 無障礙設施 */}
                                <div className="tab">
                                  <button 
                                    className={`tab-header ${activeTab[floorIndex] === 'facilities' ? 'active' : ''}`} 
                                    onClick={() => toggleTab(floorIndex, 'facilities')}
                                  >
                                    <span className="tab-icon">🚻</span> 
                                    <span className="tab-title">無障礙設施</span>
                                    {(!floor.features.toilet?.properHeight || 
                                      !floor.features.handrails?.exists || 
                                      !floor.features.sink?.exists || 
                                      !floor.features.emergencyCall?.exists ||
                                      floor.features.toiletPaper?.improperPlacement) ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </button>
                                  <div className={`tab-content ${activeTab[floorIndex] === 'facilities' ? 'active' : ''}`}>
                                    <div className="feature-category">                                  
                                      <div className="feature-item">
                                        <span className="feature-label">馬桶高度:</span>
                                        <span className={`feature-value ${floor.features.toilet?.properHeight ? 'positive' : 'negative'}`}>
                                          {floor.features.toilet?.properHeight ? 
                                          '適宜高度' : '⚠️ 高度不適宜'}
                                          {floor.features.toilet?.height && 
                                          ` (${floor.features.toilet.height}公分)`}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">扶手:</span>
                                        <span className={`feature-value ${floor.features.handrails?.exists ? 'positive' : 'negative'}`}>
                                          {floor.features.handrails?.exists ? '有' : '⚠️ 無'}
                                          {floor.features.handrails?.exists && floor.features.handrails?.properHeight && 
                                          ' (高度合適)'}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">洗手台:</span>
                                        <span className={`feature-value ${floor.features.sink?.exists && floor.features.sink?.accessible ? 'positive' : 'negative'}`}>
                                          {floor.features.sink?.exists ? 
                                            (floor.features.sink?.accessible ? '有 (適合輪椅使用)' : '⚠️ 有 (不適合輪椅使用)') : 
                                            '⚠️ 無'}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">緊急求助鈴:</span>
                                        <span className={`feature-value ${floor.features.emergencyCall?.exists ? 'positive' : 'negative'}`}>
                                          {floor.features.emergencyCall?.exists ? 
                                          '有' : '⚠️ 無'}
                                        </span>
                                      </div>
                                      
                                      {floor.features.toiletPaper?.improperPlacement && (
                                        <div className="feature-item">
                                          <span className="feature-label">衛生紙:</span>
                                          <span className="feature-value negative">
                                            ⚠️ 擺放位置不當
                                            {floor.features.toiletPaper?.placementDescription && 
                                            ` (${floor.features.toiletPaper.placementDescription})`}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 地面與通道 */}
                                <div className="tab">
                                  <button 
                                    className={`tab-header ${activeTab[floorIndex] === 'pathway' ? 'active' : ''}`}
                                    onClick={() => toggleTab(floorIndex, 'pathway')}
                                  >
                                    <span className="tab-icon">🛣️</span> 
                                    <span className="tab-title">地面與通道</span>
                                    {(!floor.features.floor?.nonSlip || 
                                      (!floor.features.threshold?.none && !floor.features.threshold?.hasRamp) || 
                                      !floor.features.pathway?.adequate) ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </button>
                                  <div className={`tab-content ${activeTab[floorIndex] === 'pathway' ? 'active' : ''}`}>
                                    <div className="feature-category">                                  
                                      <div className="feature-item">
                                        <span className="feature-label">防滑地板:</span>
                                        <span className={`feature-value ${floor.features.floor?.nonSlip ? 'positive' : 'negative'}`}>
                                          {floor.features.floor?.nonSlip ? 
                                          '是' : '⚠️ 否'}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">無門檻設計:</span>
                                        <span className={`feature-value ${floor.features.threshold?.none || floor.features.threshold?.hasRamp ? 'positive' : 'negative'}`}>
                                          {floor.features.threshold?.none ? 
                                          '是' : '⚠️ 否'}
                                          {!floor.features.threshold?.none && floor.features.threshold?.hasRamp && 
                                          ' (有坡道)'}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">通道寬度:</span>
                                        <span className={`feature-value ${floor.features.pathway?.adequate ? 'positive' : 'negative'}`}>
                                          {floor.features.pathway?.adequate ? 
                                          '足夠' : '⚠️ 不足'}
                                          {floor.features.pathway?.width && 
                                          ` (${floor.features.pathway.width}公分)`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 標示與照明 */}
                                <div className="tab">
                                  <button 
                                    className={`tab-header ${activeTab[floorIndex] === 'signage' ? 'active' : ''}`}
                                    onClick={() => toggleTab(floorIndex, 'signage')}
                                  >
                                    <span className="tab-icon">💡</span>
                                    <span className="tab-title">標示與照明</span>
                                    {(!floor.features.signage?.clear || 
                                      !floor.features.lighting?.adequate) ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </button>
                                  <div className={`tab-content ${activeTab[floorIndex] === 'signage' ? 'active' : ''}`}>
                                    <div className="feature-category">                                  
                                      <div className="feature-item">
                                        <span className="feature-label">無障礙標誌:</span>
                                        <span className={`feature-value ${floor.features.signage?.clear ? 'positive' : 'negative'}`}>
                                          {floor.features.signage?.clear ? 
                                          '清晰可見' : '⚠️ 標示不明'}
                                        </span>
                                      </div>
                                      
                                      <div className="feature-item">
                                        <span className="feature-label">照明:</span>
                                        <span className={`feature-value ${floor.features.lighting?.adequate ? 'positive' : 'negative'}`}>
                                          {floor.features.lighting?.adequate ? 
                                          '良好' : '⚠️ 不足'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 嚴重問題 */}
                                {floor.features.issues && (
                                  floor.features.issues.usedAsStorage || 
                                  floor.features.issues.needsRenovation || 
                                  floor.features.issues.otherIssues) && (
                                  <div className="tab">
                                    <button 
                                      className={`tab-header critical ${activeTab[floorIndex] === 'issues' ? 'active' : ''}`}
                                      onClick={() => toggleTab(floorIndex, 'issues')}
                                    >
                                      <span className="tab-icon">⚠️</span> 
                                      <span className="tab-title">嚴重問題</span>
                                    </button>
                                    <div className={`tab-content ${activeTab[floorIndex] === 'issues' ? 'active' : ''}`}>
                                      <div className="feature-category critical-issues">                                  
                                        {floor.features.issues?.usedAsStorage && (
                                          <div className="feature-item">
                                            <span className="feature-label">用途變更:</span>
                                            <span className="feature-value negative">
                                              ⚠️ 已變為工具間/儲藏室
                                            </span>
                                          </div>
                                        )}
                                        
                                        {floor.features.issues?.needsRenovation && (
                                          <div className="feature-item">
                                            <span className="feature-label">老舊程度:</span>
                                            <span className="feature-value negative">
                                              ⚠️ 需要整修
                                            </span>
                                          </div>
                                        )}
                                        
                                        {floor.features.issues?.otherIssues && (
                                          <div className="feature-item">
                                            <span className="feature-label">其他問題:</span>
                                            <span className="feature-value negative">
                                              ⚠️ {floor.features.issues.otherIssues}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="bathroom-issues-legend">
                <div className="legend-title">問題嚴重性標示說明</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="issue-badge critical">嚴重問題</span>
                    <span className="legend-description">結構性問題，完全影響使用功能</span>
                  </div>
                  <div className="legend-item">
                    <span className="issue-badge major">主要問題</span>
                    <span className="legend-description">顯著影響無障礙使用</span>
                  </div>
                  <div className="legend-item">
                    <span className="issue-badge moderate">中度問題</span>
                    <span className="legend-description">部分影響無障礙使用</span>
                  </div>
                  <div className="legend-item">
                    <span className="issue-badge minor">輕微問題</span>
                    <span className="legend-description">對使用有輕微影響</span>
                  </div>
                </div>
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
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" width="64" height="64">
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 5c-.395 0-.77.167-1.038.462l-5.5 6.037a1.27 1.27 0 0 0-.033 1.642.95.95 0 0 0 1.437.059l5.133-5.63 5.097 5.63a.95.95 0 0 0 1.437-.059 1.27 1.27 0 0 0-.033-1.642l-5.503-6.037A1.204 1.204 0 0 0 12 7z" />
            </svg>
            <p>尚未登記此建築物的無障礙廁所資訊</p>
            <Link to={`/edit/bathroom/${id}`} className="btn-primary">
              添加無障礙廁所資訊
            </Link>
          </div>
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

// 獲取問題的中文標籤
function getIssueLabel(issueKey) {
  const issueLabels = {
    'doorWidth': '門寬不足',
    'innerSpace': '內部空間不足',
    'doorLock': '門鎖問題',
    'toilet': '馬桶高度不適宜',
    'handrails': '缺少扶手',
    'sink': '洗手台問題',
    'emergencyCall': '無緊急求助鈴',
    'floor': '地板問題',
    'threshold': '門檻高低差',
    'pathway': '通道寬度不足',
    'signage': '標示不明顯',
    'lighting': '照明不足',
    'usedAsStorage': '被用作儲藏室',
    'needsRenovation': '需要整修',
    'otherIssues': '其他問題',
    'toiletPaper': '衛生紙擺放不當',
    'rotationSpace': '旋轉空間不足'
  };
  return issueLabels[issueKey] || issueKey;
}

export default BuildingDetail;