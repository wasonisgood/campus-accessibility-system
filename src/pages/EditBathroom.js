// src/pages/EditBathroom.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, query, collection, where, getDocs } from '../firebase/firebase';
import './EditBathroom.css';

const EditBathroom = () => {
  const { id } = useParams(); // 這裡的id是bathroom的id
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hasAccessibleBathroom: false,
    floors: [],
    buildingId: ''
  });
  const [buildingData, setBuildingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 獲取廁所和建築物數據
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 先通過查詢獲取廁所數據
        const bathroomsQuery = query(
          collection(db, 'bathrooms'), 
          where('buildingId', '==', id)
        );
        
        const bathroomsSnapshot = await getDocs(bathroomsQuery);
        
        let bathroomData;
        let bathroomId;
        
        // 查看是否找到了匹配的廁所記錄
        if (!bathroomsSnapshot.empty) {
          const bathroomDoc = bathroomsSnapshot.docs[0];
          bathroomId = bathroomDoc.id;
          bathroomData = bathroomDoc.data();
        } else {
          // 嘗試直接通過ID獲取
          const bathroomRef = doc(db, 'bathrooms', id);
          const bathroomDocSnap = await getDoc(bathroomRef);
          
          if (!bathroomDocSnap.exists()) {
            setError('找不到該廁所的信息');
            setLoading(false);
            return;
          }
          
          bathroomId = id;
          bathroomData = bathroomDocSnap.data();
        }
        
        // 設置廁所數據
        setFormData({
          hasAccessibleBathroom: bathroomData.hasAccessibleBathroom || false,
          floors: bathroomData.floors || [],
          buildingId: bathroomData.buildingId || ''
        });
        
        // 獲取相關建築物數據
        if (bathroomData.buildingId) {
          const buildingRef = doc(db, 'buildings', bathroomData.buildingId);
          const buildingDoc = await getDoc(buildingRef);
          
          if (buildingDoc.exists()) {
            setBuildingData(buildingDoc.data());
          } else {
            setError('找不到相關建築物的信息');
          }
        } else {
          setError('廁所記錄缺少建築物關聯');
        }
      } catch (error) {
        console.error('Error fetching bathroom data:', error);
        setError('獲取廁所信息時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 處理主要複選框變更
  const handleMainChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // 處理樓層數據變更
  const handleFloorChange = (floorIndex, e) => {
    const { name, checked, value, type } = e.target;
    
    // 複製當前樓層數據
    const updatedFloors = [...formData.floors];
    
    // 根據名稱更新不同的屬性
    if (name === 'hasAccessible') {
      updatedFloors[floorIndex].hasAccessible = checked;
    } else if (name.includes('.')) {
      // 處理嵌套屬性，例如 "features.handrails.exists"
      const parts = name.split('.');
      let target = updatedFloors[floorIndex];
      
      // 導航到倒數第二層
      for (let i = 0; i < parts.length - 1; i++) {
        if (target[parts[i]] === undefined) {
          target[parts[i]] = {};
        }
        target = target[parts[i]];
      }
      
      // 設置最後一個屬性的值
      const lastPart = parts[parts.length - 1];
      target[lastPart] = type === 'checkbox' ? checked : value;
    }
    
    setFormData(prev => ({
      ...prev,
      floors: updatedFloors
    }));
  };

  // 確定是否顯示詳細的無障礙設施選項
  const shouldShowAccessibleDetails = (floorIndex) => {
    // 如果建築物沒有電梯，只在第一層顯示詳細選項
    if (buildingData && !buildingData.hasElevator && floorIndex > 0) {
      return false;
    }
    
    // 如果這個樓層被標記為有無障礙廁所，則顯示詳細選項
    return formData.floors[floorIndex] && formData.floors[floorIndex].hasAccessible;
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // 先通過查詢獲取廁所ID
      const bathroomsQuery = query(
        collection(db, 'bathrooms'), 
        where('buildingId', '==', formData.buildingId)
      );
      
      const bathroomsSnapshot = await getDocs(bathroomsQuery);
      
      let bathroomId;
      
      // 查看是否找到了匹配的廁所記錄
      if (!bathroomsSnapshot.empty) {
        bathroomId = bathroomsSnapshot.docs[0].id;
      } else {
        // 如果沒有找到，使用URL中的ID
        bathroomId = id;
      }
      
      // 更新廁所數據
      const bathroomRef = doc(db, 'bathrooms', bathroomId);
      await updateDoc(bathroomRef, {
        hasAccessibleBathroom: formData.hasAccessibleBathroom,
        floors: formData.floors
      });
      
      setSuccess(true);
      
      // 延遲後返回建築物詳情頁
      setTimeout(() => {
        navigate(`/building/${formData.buildingId}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating bathroom:', error);
      setError('更新廁所信息時發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-container">載入中...</div>;
  }

  if (error && !buildingData) {
    return (
      <div className="error-container" role="alert">
        <p>{error}</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="edit-bathroom-container">
      <h2>編輯無障礙廁所信息</h2>
      {buildingData && (
        <p className="building-info">
          所屬建築物: <Link to={`/building/${formData.buildingId}`}>{buildingData.name}</Link>
        </p>
      )}
      
      {success && (
        <div className="success-message" role="alert">
          廁所信息更新成功！正在返回詳情頁...
        </div>
      )}
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group checkbox-group">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="hasAccessibleBathroom"
              name="hasAccessibleBathroom"
              checked={formData.hasAccessibleBathroom}
              onChange={handleMainChange}
              disabled={submitting}
              aria-label="建築物是否有無障礙廁所"
            />
            <label htmlFor="hasAccessibleBathroom" className="checkbox-label">
              此建築物有無障礙廁所
            </label>
          </div>
        </div>

        {formData.hasAccessibleBathroom && buildingData && (
          <div className="floor-sections">
            <h3>請標記每個樓層的無障礙廁所情況</h3>
            
            {formData.floors.map((floor, index) => (
              <div key={`floor-${index}`} className="floor-section">
                <h4>
                  {index + 1} 樓
                  {buildingData && !buildingData.hasElevator && index > 0 && (
                    <span className="no-elevator-badge">
                      無電梯
                    </span>
                  )}
                </h4>
                
                <div className="form-group checkbox-group">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id={`floor-${index}-hasAccessible`}
                      name="hasAccessible"
                      checked={floor.hasAccessible}
                      onChange={(e) => handleFloorChange(index, e)}
                      disabled={submitting || (!buildingData.hasElevator && index > 0)}
                      aria-label={`${index + 1}樓是否有無障礙廁所`}
                    />
                    <label htmlFor={`floor-${index}-hasAccessible`} className="checkbox-label">
                      此樓層有無障礙廁所
                    </label>
                  </div>
                </div>

                {shouldShowAccessibleDetails(index) && (
                  <div className="accessible-details">
                    {/* 扶手信息 */}
                    <div className="feature-section">
                      <h5>扶手</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-handrails-exists`}
                            name="features.handrails.exists"
                            checked={floor.features?.handrails?.exists || false}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            aria-label={`${index + 1}樓無障礙廁所是否有扶手`}
                          />
                          <label htmlFor={`floor-${index}-handrails-exists`} className="checkbox-label">
                            廁所有扶手
                          </label>
                        </div>
                      </div>

                      {floor.features?.handrails?.exists && (
                        <>
                          <div className="form-group checkbox-group">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={`floor-${index}-handrails-properHeight`}
                                name="features.handrails.properHeight"
                                checked={floor.features?.handrails?.properHeight || false}
                                onChange={(e) => handleFloorChange(index, e)}
                                disabled={submitting}
                                aria-label={`${index + 1}樓無障礙廁所扶手高度是否合適`}
                              />
                              <label htmlFor={`floor-${index}-handrails-properHeight`} className="checkbox-label">
                                扶手高度合適
                              </label>
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor={`floor-${index}-handrails-notes`}>
                              扶手備註
                            </label>
                            <textarea
                              id={`floor-${index}-handrails-notes`}
                              name="features.handrails.notes"
                              value={floor.features?.handrails?.notes || ''}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              placeholder="可以描述扶手的材質、狀態等信息"
                              rows="2"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* 洗手台信息 */}
                    <div className="feature-section">
                      <h5>洗手台</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-sink-exists`}
                            name="features.sink.exists"
                            checked={floor.features?.sink?.exists || false}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            aria-label={`${index + 1}樓無障礙廁所是否有洗手台`}
                          />
                          <label htmlFor={`floor-${index}-sink-exists`} className="checkbox-label">
                            廁所有洗手台
                          </label>
                        </div>
                      </div>

                      {floor.features?.sink?.exists && (
                        <>
                          <div className="form-group checkbox-group">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={`floor-${index}-sink-accessible`}
                                name="features.sink.accessible"
                                checked={floor.features?.sink?.accessible || false}
                                onChange={(e) => handleFloorChange(index, e)}
                                disabled={submitting}
                                aria-label={`${index + 1}樓無障礙廁所洗手台是否方便使用`}
                              />
                              <label htmlFor={`floor-${index}-sink-accessible`} className="checkbox-label">
                                洗手台高度適宜且易於使用
                              </label>
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor={`floor-${index}-sink-notes`}>
                              洗手台備註
                            </label>
                            <textarea
                              id={`floor-${index}-sink-notes`}
                              name="features.sink.notes"
                              value={floor.features?.sink?.notes || ''}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              placeholder="可以描述洗手台的高度、水龍頭類型等信息"
                              rows="2"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* 門寬信息 */}
                    <div className="feature-section">
                      <h5>門寬</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-doorWidth-adequate`}
                            name="features.doorWidth.adequate"
                            checked={floor.features?.doorWidth?.adequate || false}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            aria-label={`${index + 1}樓無障礙廁所門寬是否足夠`}
                          />
                          <label htmlFor={`floor-${index}-doorWidth-adequate`} className="checkbox-label">
                            門寬足夠輪椅通過
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`floor-${index}-doorWidth-notes`}>
                          門寬備註
                        </label>
                        <textarea
                          id={`floor-${index}-doorWidth-notes`}
                          name="features.doorWidth.notes"
                          value={floor.features?.doorWidth?.notes || ''}
                          onChange={(e) => handleFloorChange(index, e)}
                          disabled={submitting}
                          placeholder="可以描述門的開啟方向、具體寬度等信息"
                          rows="2"
                        />
                      </div>
                    </div>

                    {/* 門鎖信息 */}
                    <div className="feature-section">
                      <h5>門鎖</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-doorLock-functional`}
                            name="features.doorLock.functional"
                            checked={floor.features?.doorLock?.functional || false}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            aria-label={`${index + 1}樓無障礙廁所門鎖是否易用`}
                          />
                          <label htmlFor={`floor-${index}-doorLock-functional`} className="checkbox-label">
                            門鎖易於操作
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`floor-${index}-doorLock-notes`}>
                          門鎖備註
                        </label>
                        <textarea
                          id={`floor-${index}-doorLock-notes`}
                          name="features.doorLock.notes"
                          value={floor.features?.doorLock?.notes || ''}
                          onChange={(e) => handleFloorChange(index, e)}
                          disabled={submitting}
                          placeholder="可以描述門鎖的類型、使用難度等信息"
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <Link 
            to={`/building/${formData.buildingId}`} 
            className="btn-secondary"
            disabled={submitting}
          >
            取消
          </Link>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? '更新中...' : '更新廁所信息'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBathroom;