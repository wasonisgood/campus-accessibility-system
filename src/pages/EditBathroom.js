// src/pages/EditBathroom.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, query, collection, where, getDocs } from '../firebase/firebase';
import './EditBathroom.css';

const EditBathroom = () => {
  const { id } = useParams(); // 這裡的id是building的id或bathroom的id
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
        let buildingId = id;
        
        // 查看是否找到了匹配的廁所記錄
        if (!bathroomsSnapshot.empty) {
          const bathroomDoc = bathroomsSnapshot.docs[0];
          bathroomId = bathroomDoc.id;
          bathroomData = bathroomDoc.data();
        } else {
          // 嘗試直接通過ID獲取
          const bathroomRef = doc(db, 'bathrooms', id);
          const bathroomDocSnap = await getDoc(bathroomRef);
          
          if (bathroomDocSnap.exists()) {
            bathroomId = id;
            bathroomData = bathroomDocSnap.data();
            buildingId = bathroomData.buildingId;
          } else {
            // 如果找不到廁所記錄，可能是新建的
            setFormData(prev => ({
              ...prev,
              buildingId: id,
              floors: Array(10).fill().map(() => ({ 
                hasAccessible: false,
                features: {
                  handrails: { exists: false },
                  sink: { exists: false },
                  doorWidth: { adequate: false },
                  doorLock: { functional: false },
                  toilet: { properHeight: false },
                  doorType: { value: '向外開門' },
                  innerSpace: { adequate: false },
                  emergencyCall: { exists: false },
                  floor: { nonSlip: false },
                  threshold: { none: false },
                  pathway: { adequate: false },
                  signage: { clear: false },
                  lighting: { adequate: false },
                  issues: { usedAsStorage: false, needsRenovation: false }
                }
              }))
            }));
          }
        }
        
        // 設置廁所數據（如果存在）
        if (bathroomData) {
          // 確保每個樓層都有完整的特徵結構
          const updatedFloors = bathroomData.floors?.map(floor => ({
            hasAccessible: floor.hasAccessible || false,
            features: {
              // 原有特徵
              handrails: floor.features?.handrails || { exists: false },
              sink: floor.features?.sink || { exists: false },
              doorWidth: floor.features?.doorWidth || { adequate: false },
              doorLock: floor.features?.doorLock || { functional: false },
              
              // 新增特徵
              toilet: floor.features?.toilet || { properHeight: false },
              doorType: floor.features?.doorType || { value: '向外開門' },
              innerSpace: floor.features?.innerSpace || { adequate: false },
              emergencyCall: floor.features?.emergencyCall || { exists: false },
              floor: floor.features?.floor || { nonSlip: false },
              threshold: floor.features?.threshold || { none: false },
              pathway: floor.features?.pathway || { adequate: false },
              signage: floor.features?.signage || { clear: false },
              lighting: floor.features?.lighting || { adequate: false },
              issues: floor.features?.issues || { usedAsStorage: false, needsRenovation: false }
            }
          })) || [];
          
          setFormData({
            hasAccessibleBathroom: bathroomData.hasAccessibleBathroom || false,
            floors: updatedFloors,
            buildingId: bathroomData.buildingId || buildingId
          });
        }
        
        // 獲取相關建築物數據
        const buildingRef = doc(db, 'buildings', buildingId);
        const buildingDoc = await getDoc(buildingRef);
        
        if (buildingDoc.exists()) {
          const buildingData = buildingDoc.data();
          setBuildingData(buildingData);
          
          // 確保樓層數量與建築物樓層數匹配
          if (buildingData.floors) {
            const floorCount = parseInt(buildingData.floors);
            
            setFormData(prev => {
              // 複製當前樓層數據
              let updatedFloors = [...prev.floors];
              
              // 如果樓層數據少於建築物樓層數，增加空樓層
              if (updatedFloors.length < floorCount) {
                const additionalFloors = Array(floorCount - updatedFloors.length).fill().map(() => ({
                  hasAccessible: false,
                  features: {
                    handrails: { exists: false },
                    sink: { exists: false },
                    doorWidth: { adequate: false },
                    doorLock: { functional: false },
                    toilet: { properHeight: false },
                    doorType: { value: '向外開門' },
                    innerSpace: { adequate: false },
                    emergencyCall: { exists: false },
                    floor: { nonSlip: false },
                    threshold: { none: false },
                    pathway: { adequate: false },
                    signage: { clear: false },
                    lighting: { adequate: false },
                    issues: { usedAsStorage: false, needsRenovation: false }
                  }
                }));
                updatedFloors = [...updatedFloors, ...additionalFloors];
              } else if (updatedFloors.length > floorCount) {
                // 如果樓層數據多於建築物樓層數，截斷多餘樓層
                updatedFloors = updatedFloors.slice(0, floorCount);
              }
              
              return {
                ...prev,
                floors: updatedFloors,
                buildingId: buildingId
              };
            });
          }
        } else {
          setError('找不到相關建築物的信息');
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
      target[lastPart] = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
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
      let method = 'update';
      
      // 查看是否找到了匹配的廁所記錄
      if (!bathroomsSnapshot.empty) {
        bathroomId = bathroomsSnapshot.docs[0].id;
      } else {
        // 如果沒有找到，檢查URL中的ID是否為廁所ID
        try {
          const bathroomRef = doc(db, 'bathrooms', id);
          const bathroomDoc = await getDoc(bathroomRef);
          
          if (bathroomDoc.exists()) {
            bathroomId = id;
          } else {
            // 需要創建新記錄
            method = 'create';
          }
        } catch (error) {
          method = 'create';
        }
      }
      
      if (method === 'update' && bathroomId) {
        // 更新廁所數據
        const bathroomRef = doc(db, 'bathrooms', bathroomId);
        await updateDoc(bathroomRef, {
          hasAccessibleBathroom: formData.hasAccessibleBathroom,
          floors: formData.floors,
          buildingId: formData.buildingId,
          updatedAt: new Date()
        });
      } else {
        // 創建新記錄
        const newBathroomRef = doc(collection(db, 'bathrooms'));
        await updateDoc(newBathroomRef, {
          hasAccessibleBathroom: formData.hasAccessibleBathroom,
          floors: formData.floors,
          buildingId: formData.buildingId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
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
                    {/* 1. 扶手設計空間與尺寸 */}
                    <div className="feature-section">
                      <h5>🚪 扶手設計空間與尺寸</h5>
                      
                      {/* 門寬相關選項 */}
                      <div className="sub-feature">
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
                              門寬足夠輪椅通過（至少90公分）
                            </label>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-doorWidth-width`}>
                            實際門寬（公分）
                          </label>
                          <input
                            type="number"
                            id={`floor-${index}-doorWidth-width`}
                            name="features.doorWidth.width"
                            value={floor.features?.doorWidth?.width || ''}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            placeholder="例如: 90"
                            min="0"
                            max="300"
                          />
                        </div>
                      </div>
                      
                      {/* 門類型 */}
                      <div className="sub-feature">
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-doorType-value`}>
                            開門方式
                          </label>
                          <select
                            id={`floor-${index}-doorType-value`}
                            name="features.doorType.value"
                            value={floor.features?.doorType?.value || '向外開門'}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                          >
                            <option value="向外開門">向外開門</option>
                            <option value="向內開門">向內開門</option>
                            <option value="推拉門">推拉門</option>
                            <option value="摺疊門">摺疊門</option>
                            <option value="其他">其他</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* 內部迴轉空間 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-innerSpace-adequate`}
                              name="features.innerSpace.adequate"
                              checked={floor.features?.innerSpace?.adequate || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所內部空間是否足夠`}
                            />
                            <label htmlFor={`floor-${index}-innerSpace-adequate`} className="checkbox-label">
                              內部迴轉空間足夠（至少150cm x 150cm）
                            </label>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-innerSpace-dimensions`}>
                            空間尺寸備註
                          </label>
                          <input
                            type="text"
                            id={`floor-${index}-innerSpace-dimensions`}
                            name="features.innerSpace.dimensions"
                            value={floor.features?.innerSpace?.dimensions || ''}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            placeholder="例如: 160cm x 170cm"
                          />
                        </div>
                      </div>
                      
                      {/* 門鎖信息 */}
                      <div className="sub-feature">
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
                              門鎖易於操作（槓桿式）
                            </label>
                          </div>
                        </div>
                        
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-doorLock-hasEmergencyUnlock`}
                              name="features.doorLock.hasEmergencyUnlock"
                              checked={floor.features?.doorLock?.hasEmergencyUnlock || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所是否有緊急解鎖功能`}
                            />
                            <label htmlFor={`floor-${index}-doorLock-hasEmergencyUnlock`} className="checkbox-label">
                              有緊急解鎖功能
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 2. 無障礙設施 */}
                    <div className="feature-section">
                      <h5>🚻 無障礙設施</h5>
                      
                      {/* 馬桶信息 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-toilet-properHeight`}
                              name="features.toilet.properHeight"
                              checked={floor.features?.toilet?.properHeight || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所馬桶高度是否合適`}
                            />
                            <label htmlFor={`floor-${index}-toilet-properHeight`} className="checkbox-label">
                              馬桶高度適宜（40-50公分）
                            </label>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-toilet-height`}>
                            馬桶高度（公分）
                          </label>
                          <input
                            type="number"
                            id={`floor-${index}-toilet-height`}
                            name="features.toilet.height"
                            value={floor.features?.toilet?.height || ''}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            placeholder="例如: 45"
                            min="30"
                            max="60"
                          />
                        </div>
                      </div>
                      
                      {/* 扶手信息 */}
                      <div className="sub-feature">
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
                                  扶手高度合適（約70公分）
                                </label>
                              </div>
                            </div>
                            
                            <div className="form-group checkbox-group">
                              <div className="checkbox-wrapper">
                                <input
                                  type="checkbox"
                                  id={`floor-${index}-handrails-properDiameter`}
                                  name="features.handrails.properDiameter"
                                  checked={floor.features?.handrails?.properDiameter || false}
                                  onChange={(e) => handleFloorChange(index, e)}
                                  disabled={submitting}
                                  aria-label={`${index + 1}樓無障礙廁所扶手直徑是否合適`}
                                />
                                <label htmlFor={`floor-${index}-handrails-properDiameter`} className="checkbox-label">
                                  扶手直徑合適（3-4公分）
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
                      <div className="sub-feature">
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
                                  洗手台下方留空，方便輪椅進入
                                </label>
                              </div>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor={`floor-${index}-sink-faucetType`}>
                                水龍頭類型
                              </label>
                              <select
                                id={`floor-${index}-sink-faucetType`}
                                name="features.sink.faucetType"
                                value={floor.features?.sink?.faucetType || '感應式'}
                                onChange={(e) => handleFloorChange(index, e)}
                                disabled={submitting}
                              >
                                <option value="感應式">感應式</option>
                                <option value="槓桿式">槓桿式</option>
                                <option value="按壓式">按壓式</option>
                                <option value="旋轉式">旋轉式</option>
                                <option value="其他">其他</option>
                              </select>
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
                      
                      {/* 緊急求助鈴信息 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-emergencyCall-exists`}
                              name="features.emergencyCall.exists"
                              checked={floor.features?.emergencyCall?.exists || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所是否有緊急求助鈴`}
                            />
                            <label htmlFor={`floor-${index}-emergencyCall-exists`} className="checkbox-label">
                              有緊急求助鈴
                            </label>
                          </div>
                        </div>
                        
                        {floor.features?.emergencyCall?.exists && (
                          <div className="form-group checkbox-group">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={`floor-${index}-emergencyCall-properPlacement`}
                                name="features.emergencyCall.properPlacement"
                                checked={floor.features?.emergencyCall?.properPlacement || false}
                                onChange={(e) => handleFloorChange(index, e)}
                                disabled={submitting}
                                aria-label={`${index + 1}樓無障礙廁所緊急求助鈴位置是否合適`}
                              />
                              <label htmlFor={`floor-${index}-emergencyCall-properPlacement`} className="checkbox-label">
                                位置合適（設置於地面30公分及牆面）
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 3. 地面與通道 */}
                    <div className="feature-section">
                      <h5>🛣️ 地面與通道</h5>
                      
                      {/* 防滑地板 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-floor-nonSlip`}
                              name="features.floor.nonSlip"
                              checked={floor.features?.floor?.nonSlip || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所是否有防滑地板`}
                            />
                            <label htmlFor={`floor-${index}-floor-nonSlip`} className="checkbox-label">
                              採用防滑地板材質
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* 無門檻設計 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-threshold-none`}
                              name="features.threshold.none"
                              checked={floor.features?.threshold?.none || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所是否無門檻`}
                            />
                            <label htmlFor={`floor-${index}-threshold-none`} className="checkbox-label">
                              門口無高低差
                            </label>
                          </div>
                        </div>
                        
                        {!floor.features?.threshold?.none && (
                          <div className="form-group checkbox-group">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={`floor-${index}-threshold-hasRamp`}
                                name="features.threshold.hasRamp"
                                checked={floor.features?.threshold?.hasRamp || false}
                                onChange={(e) => handleFloorChange(index, e)}
                                disabled={submitting}
                                aria-label={`${index + 1}樓無障礙廁所是否有坡道`}
                              />
                              <label htmlFor={`floor-${index}-threshold-hasRamp`} className="checkbox-label">
                                有緩坡設計
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 通道寬度 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-pathway-adequate`}
                              name="features.pathway.adequate"
                              checked={floor.features?.pathway?.adequate || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所通道寬度是否足夠`}
                            />
                            <label htmlFor={`floor-${index}-pathway-adequate`} className="checkbox-label">
                              通道寬度足夠（至少90公分）
                            </label>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-pathway-width`}>
                            通道寬度（公分）
                          </label>
                          <input
                            type="number"
                            id={`floor-${index}-pathway-width`}
                            name="features.pathway.width"
                            value={floor.features?.pathway?.width || ''}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            placeholder="例如: 95"
                            min="0"
                            max="200"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* 4. 標示與照明 */}
                    <div className="feature-section">
                      <h5>💡 標示與照明</h5>
                      
                      {/* 無障礙標誌 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-signage-clear`}
                              name="features.signage.clear"
                              checked={floor.features?.signage?.clear || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所標誌是否清晰可見`}
                            />
                            <label htmlFor={`floor-${index}-signage-clear`} className="checkbox-label">
                              無障礙標誌明確且易於辨識
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* 照明 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-lighting-adequate`}
                              name="features.lighting.adequate"
                              checked={floor.features?.lighting?.adequate || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所照明是否良好`}
                            />
                            <label htmlFor={`floor-${index}-lighting-adequate`} className="checkbox-label">
                              照明明亮且不刺眼
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 5. 其他問題 */}
                    <div className="feature-section">
                      <h5>⚠️ 其他問題</h5>
                      
                      {/* 用途變更 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-issues-usedAsStorage`}
                              name="features.issues.usedAsStorage"
                              checked={floor.features?.issues?.usedAsStorage || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所是否被用作儲藏室`}
                            />
                            <label htmlFor={`floor-${index}-issues-usedAsStorage`} className="checkbox-label">
                              無障礙廁所被用作工具間/儲藏室
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* 老舊需整修 */}
                      <div className="sub-feature">
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-issues-needsRenovation`}
                              name="features.issues.needsRenovation"
                              checked={floor.features?.issues?.needsRenovation || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所是否需要整修`}
                            />
                            <label htmlFor={`floor-${index}-issues-needsRenovation`} className="checkbox-label">
                              樓棟老舊需要整修
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* 其他問題 */}
                      <div className="sub-feature">
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-issues-otherIssues`}>
                            其他問題
                          </label>
                          <textarea
                            id={`floor-${index}-issues-otherIssues`}
                            name="features.issues.otherIssues"
                            value={floor.features?.issues?.otherIssues || ''}
                            onChange={(e) => handleFloorChange(index, e)}
                            disabled={submitting}
                            placeholder="描述其他存在的問題"
                            rows="3"
                          />
                        </div>
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