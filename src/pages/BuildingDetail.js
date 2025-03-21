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
          <Link to={`/edit/bathroom/${bathroom.id}`} className="btn-secondary btn-sm">
            編輯
          </Link>
          {bathroom.hasAccessibleBathroom ? (
            <div className="bathroom-info">
              <div className="bathroom-status positive">
                此建築物有無障礙廁所
              </div>
              
              <h3>樓層分佈</h3>
              <div className="floors-grid">
                {bathroom.floors && bathroom.floors.map((floor, index) => {
                  // 計算問題數量和嚴重性
                  let problemCount = 0;
                  let criticalIssues = [];
                  
                  if (floor.hasAccessible && floor.features) {
                    // 檢查各種嚴重性問題
                    if (floor.features.issues?.usedAsStorage) {
                      criticalIssues.push({ type: 'critical', text: '已變為工具間/儲藏室' });
                      problemCount++;
                    }
                    
                    if (floor.features.issues?.needsRenovation) {
                      criticalIssues.push({ type: 'critical', text: '需要整修' });
                      problemCount++;
                    }
                    
                    if (floor.features.issues?.otherIssues) {
                      criticalIssues.push({ type: 'critical', text: floor.features.issues.otherIssues });
                      problemCount++;
                    }
                    
                    // 檢查主要功能性問題
                    if (!floor.features.doorWidth?.adequate) {
                      criticalIssues.push({ type: 'major', text: '門寬不足' });
                      problemCount++;
                    }
                    
                    if (!floor.features.innerSpace?.adequate) {
                      criticalIssues.push({ type: 'major', text: '內部迴轉空間不足' });
                      problemCount++;
                    }
                    
                    if (!floor.features.doorLock?.functional) {
                      criticalIssues.push({ type: 'major', text: '門鎖操作困難' });
                      problemCount++;
                    }
                    
                    if (!floor.features.toilet?.properHeight) {
                      criticalIssues.push({ type: 'moderate', text: '馬桶高度不適宜' });
                      problemCount++;
                    }
                    
                    if (!floor.features.handrails?.exists) {
                      criticalIssues.push({ type: 'major', text: '缺少扶手' });
                      problemCount++;
                    }
                    
                    if (!floor.features.sink?.exists || !floor.features.sink?.accessible) {
                      criticalIssues.push({ type: 'moderate', text: '洗手台不適合輪椅使用' });
                      problemCount++;
                    }
                    
                    if (!floor.features.emergencyCall?.exists) {
                      criticalIssues.push({ type: 'moderate', text: '無緊急求助鈴' });
                      problemCount++;
                    }
                    
                    if (!floor.features.floor?.nonSlip) {
                      criticalIssues.push({ type: 'minor', text: '地板無防滑處理' });
                      problemCount++;
                    }
                    
                    if (!floor.features.threshold?.none && !floor.features.threshold?.hasRamp) {
                      criticalIssues.push({ type: 'moderate', text: '門檻高低差無坡道處理' });
                      problemCount++;
                    }
                    
                    if (!floor.features.pathway?.adequate) {
                      criticalIssues.push({ type: 'major', text: '通道寬度不足' });
                      problemCount++;
                    }
                    
                    if (!floor.features.signage?.clear) {
                      criticalIssues.push({ type: 'minor', text: '標示不明顯' });
                      problemCount++;
                    }
                    
                    if (!floor.features.lighting?.adequate) {
                      criticalIssues.push({ type: 'minor', text: '照明不足' });
                      problemCount++;
                    }
                  }
                  
                  return (
                    <div key={index} className={`floor-card ${floor.hasAccessible ? 'has-accessible' : 'no-accessible'}`}>
                      <div className="floor-header">
                        <h4>{index + 1} 樓</h4>
                        {floor.hasAccessible ? (
                          <>
                            <div className="status-badge positive">有無障礙廁所</div>
                            {problemCount > 0 && (
                              <div className={`problem-counter ${problemCount > 6 ? 'severe' : problemCount > 3 ? 'moderate' : 'minor'}`}>
                                {problemCount} 個問題
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="status-badge negative">無無障礙廁所</div>
                        )}
                      </div>
                      
                      {floor.hasAccessible && (
                        <div className="floor-accessible-info">
                          {problemCount > 0 && (
                            <div className="issues-summary">
                              <h5>⚠️ 主要問題</h5>
                              <div className="issues-list">
                                {criticalIssues
                                  .sort((a, b) => {
                                    const priority = { critical: 0, major: 1, moderate: 2, minor: 3 };
                                    return priority[a.type] - priority[b.type];
                                  })
                                  .slice(0, 5)
                                  .map((issue, i) => (
                                    <div key={i} className={`issue-badge ${issue.type}`}>
                                      {issue.text}
                                    </div>
                                  ))}
                                {criticalIssues.length > 5 && (
                                  <div className="more-issues">
                                    +{criticalIssues.length - 5} 個其他問題
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {floor.features && (
                            <div className="features-list">
                              <div className="features-tabs">
                                <details>
                                  <summary className="tab-summary">
                                    <span className="tab-icon">🚪</span> 
                                    空間與尺寸
                                    {!floor.features.doorWidth?.adequate || 
                                     !floor.features.innerSpace?.adequate || 
                                     !floor.features.doorLock?.functional ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </summary>
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
                                </details>
                                
                                <details>
                                  <summary className="tab-summary">
                                    <span className="tab-icon">🚻</span> 
                                    無障礙設施
                                    {!floor.features.toilet?.properHeight || 
                                     !floor.features.handrails?.exists || 
                                     !floor.features.sink?.exists || 
                                     !floor.features.emergencyCall?.exists ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </summary>
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
                                  </div>
                                </details>
                                
                                <details>
                                  <summary className="tab-summary">
                                    <span className="tab-icon">🛣️</span> 
                                    地面與通道
                                    {!floor.features.floor?.nonSlip || 
                                     (!floor.features.threshold?.none && !floor.features.threshold?.hasRamp) || 
                                     !floor.features.pathway?.adequate ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </summary>
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
                                </details>
                                
                                <details>
                                  <summary className="tab-summary">
                                    <span className="tab-icon">💡</span>
                                    標示與照明
                                    {!floor.features.signage?.clear || 
                                     !floor.features.lighting?.adequate ? 
                                      <span className="tab-issue-marker">⚠️</span> : ''}
                                  </summary>
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
                                </details>
                                
                                {floor.features.issues && (
                                  floor.features.issues.usedAsStorage || 
                                  floor.features.issues.needsRenovation || 
                                  floor.features.issues.otherIssues) && (
                                  <details open>
                                    <summary className="tab-summary critical">
                                      <span className="tab-icon">⚠️</span> 
                                      嚴重問題
                                    </summary>
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
                                  </details>
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