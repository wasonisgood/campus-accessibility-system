import React, { useState, useEffect } from 'react';
import './BathroomForm.css';

const BathroomForm = ({ formData, buildingData, updateFormData, prevStep, submitData, loading }) => {
  const [errors, setErrors] = useState({});
  const [floorData, setFloorData] = useState([]);

  // 初始化樓層數據
  useEffect(() => {
    if (buildingData.floors > 0) {
      // 確保 formData.floors 是數組
      const currentFloors = Array.isArray(formData.floors) ? formData.floors : [];
      
      // 創建樓層數據結構
      const newFloorData = [];
      for (let i = 1; i <= buildingData.floors; i++) {
        // 從現有數據中查找這個樓層的數據，如果沒有則創建新的
        const existingFloor = currentFloors.find(floor => floor.number === i);
        
        newFloorData.push(existingFloor || {
          number: i,
          hasAccessible: false,
          features: {
            handrails: {
              exists: false,
              properHeight: false,
              notes: ''
            },
            sink: {
              exists: false,
              accessible: false,
              notes: ''
            },
            doorWidth: {
              adequate: false,
              notes: ''
            },
            doorLock: {
              functional: false,
              notes: ''
            }
          }
        });
      }
      
      setFloorData(newFloorData);
      
      // 更新表單數據
      updateFormData({
        hasAccessibleBathroom: formData.hasAccessibleBathroom || false,
        floors: newFloorData
      });
    }
  }, [buildingData.floors]);

  const validate = () => {
    // 如果用戶表示有無障礙廁所，確保至少有一個樓層被標記為有無障礙廁所
    if (formData.hasAccessibleBathroom) {
      const hasAnyAccessible = floorData.some(floor => floor.hasAccessible);
      
      if (!hasAnyAccessible) {
        setErrors({ general: "您已表示該建築有無障礙廁所，請標記至少一個樓層的無障礙廁所資訊" });
        return false;
      }
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      submitData();
    }
  };

  const handleMainChange = (e) => {
    const { name, checked } = e.target;
    updateFormData({ [name]: checked });
  };

  const handleFloorChange = (floorIndex, e) => {
    const { name, checked, value, type } = e.target;
    
    // 複製當前樓層數據
    const updatedFloors = [...floorData];
    
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
    
    setFloorData(updatedFloors);
    updateFormData({ floors: updatedFloors });
  };

  // 是否顯示詳細的無障礙設施選項
  const shouldShowAccessibleDetails = floorIndex => {
    // 如果建築物沒有電梯，只在第一層顯示詳細選項
    if (!buildingData.hasElevator && floorIndex > 0) {
      return false;
    }
    
    // 如果這個樓層被標記為有無障礙廁所，則顯示詳細選項
    return floorData[floorIndex] && floorData[floorIndex].hasAccessible;
  };

  // 根據勾選狀態返回「有」或「沒有」
  const getStatusText = (isChecked) => {
    return isChecked ? '有' : '沒有';
  };

  return (
    <div className="form-container">
      <h2>第三步：無障礙廁所資訊</h2>
      <p className="form-description">
        請提供建築物中無障礙廁所的詳細資訊，這對行動不便的人士至關重要。
      </p>

      {errors.general && (
        <div className="error-banner" role="alert">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group checkbox-group">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="hasAccessibleBathroom"
              name="hasAccessibleBathroom"
              checked={formData.hasAccessibleBathroom}
              onChange={handleMainChange}
              aria-label="建築物是否有無障礙廁所"
            />
            <label htmlFor="hasAccessibleBathroom" className="checkbox-label">
              此建築物有無障礙廁所
              <span className="status-text">
                {getStatusText(formData.hasAccessibleBathroom)}
              </span>
            </label>
          </div>
        </div>

        {formData.hasAccessibleBathroom && (
          <div className="floor-sections">
            <h3>請標記每個樓層的無障礙廁所情況</h3>
            
            {floorData.map((floor, index) => (
              <div key={`floor-${index}`} className="floor-section">
                <h4>
                  {index + 1} 樓
                  {!buildingData.hasElevator && index > 0 && (
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
                      aria-label={`${index + 1}樓是否有無障礙廁所`}
                      disabled={!buildingData.hasElevator && index > 0}
                    />
                    <label htmlFor={`floor-${index}-hasAccessible`} className="checkbox-label">
                      此樓層有無障礙廁所
                      <span className="status-text">
                        {getStatusText(floor.hasAccessible)}
                      </span>
                    </label>
                  </div>
                </div>

                {shouldShowAccessibleDetails(index) && (
                  <div className="accessible-details">
                    {/* 扶手資訊 */}
                    <div className="feature-section">
                      <h5>扶手</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-handrails-exists`}
                            name="features.handrails.exists"
                            checked={floor.features.handrails.exists}
                            onChange={(e) => handleFloorChange(index, e)}
                            aria-label={`${index + 1}樓無障礙廁所是否有扶手`}
                          />
                          <label htmlFor={`floor-${index}-handrails-exists`} className="checkbox-label">
                            廁所有扶手
                            <span className="status-text">
                              {getStatusText(floor.features.handrails.exists)}
                            </span>
                          </label>
                        </div>
                      </div>

                      {floor.features.handrails.exists && (
                        <>
                          <div className="form-group checkbox-group">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={`floor-${index}-handrails-properHeight`}
                                name="features.handrails.properHeight"
                                checked={floor.features.handrails.properHeight}
                                onChange={(e) => handleFloorChange(index, e)}
                                aria-label={`${index + 1}樓無障礙廁所扶手高度是否合適`}
                              />
                              <label htmlFor={`floor-${index}-handrails-properHeight`} className="checkbox-label">
                                扶手高度合適
                                <span className="status-text">
                                  {getStatusText(floor.features.handrails.properHeight)}
                                </span>
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
                              value={floor.features.handrails.notes || ''}
                              onChange={(e) => handleFloorChange(index, e)}
                              placeholder="可以描述扶手的材質、狀態等資訊"
                              rows="2"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* 洗手台資訊 */}
                    <div className="feature-section">
                      <h5>洗手台</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-sink-exists`}
                            name="features.sink.exists"
                            checked={floor.features.sink.exists}
                            onChange={(e) => handleFloorChange(index, e)}
                            aria-label={`${index + 1}樓無障礙廁所是否有洗手台`}
                          />
                          <label htmlFor={`floor-${index}-sink-exists`} className="checkbox-label">
                            廁所有洗手台
                            <span className="status-text">
                              {getStatusText(floor.features.sink.exists)}
                            </span>
                          </label>
                        </div>
                      </div>

                      {floor.features.sink.exists && (
                        <>
                          <div className="form-group checkbox-group">
                            <div className="checkbox-wrapper">
                              <input
                                type="checkbox"
                                id={`floor-${index}-sink-accessible`}
                                name="features.sink.accessible"
                                checked={floor.features.sink.accessible}
                                onChange={(e) => handleFloorChange(index, e)}
                                aria-label={`${index + 1}樓無障礙廁所洗手台是否方便使用`}
                              />
                              <label htmlFor={`floor-${index}-sink-accessible`} className="checkbox-label">
                                洗手台高度適宜且易於使用
                                <span className="status-text">
                                  {getStatusText(floor.features.sink.accessible)}
                                </span>
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
                              value={floor.features.sink.notes || ''}
                              onChange={(e) => handleFloorChange(index, e)}
                              placeholder="可以描述洗手台的高度、水龍頭類型等資訊"
                              rows="2"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* 門寬資訊 */}
                    <div className="feature-section">
                      <h5>門寬</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-doorWidth-adequate`}
                            name="features.doorWidth.adequate"
                            checked={floor.features.doorWidth.adequate}
                            onChange={(e) => handleFloorChange(index, e)}
                            aria-label={`${index + 1}樓無障礙廁所門寬是否足夠`}
                          />
                          <label htmlFor={`floor-${index}-doorWidth-adequate`} className="checkbox-label">
                            門寬足夠輪椅通過
                            <span className="status-text">
                              {getStatusText(floor.features.doorWidth.adequate)}
                            </span>
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
                          value={floor.features.doorWidth.notes || ''}
                          onChange={(e) => handleFloorChange(index, e)}
                          placeholder="可以描述門的開啟方向、具體寬度等資訊"
                          rows="2"
                        />
                      </div>
                    </div>

                    {/* 門鎖資訊 */}
                    <div className="feature-section">
                      <h5>門鎖</h5>
                      <div className="form-group checkbox-group">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`floor-${index}-doorLock-functional`}
                            name="features.doorLock.functional"
                            checked={floor.features.doorLock.functional}
                            onChange={(e) => handleFloorChange(index, e)}
                            aria-label={`${index + 1}樓無障礙廁所門鎖是否易用`}
                          />
                          <label htmlFor={`floor-${index}-doorLock-functional`} className="checkbox-label">
                            門鎖易於操作
                            <span className="status-text">
                              {getStatusText(floor.features.doorLock.functional)}
                            </span>
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
                          value={floor.features.doorLock.notes || ''}
                          onChange={(e) => handleFloorChange(index, e)}
                          placeholder="可以描述門鎖的類型、使用難度等資訊"
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
          <button type="button" className="btn-secondary" onClick={prevStep} disabled={loading}>
            上一步
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '提交中...' : '提交登記'}
          </button>
        </div>
      </form>

      <div className="help-text">
        <h3>填寫提示</h3>
        <ul>
          <li>輪椅通行的標準門寬通常至少為 80-90 厘米</li>
          <li>適合的扶手高度通常為地面以上 70-80 厘米</li>
          <li>適合輪椅使用者的洗手台高度通常為地面以上 75-80 厘米，並有足夠膝蓋空間</li>
          <li>如果您不確定某些具體尺寸，可以在備註中提供您的觀察</li>
        </ul>
      </div>
    </div>
  );
};

export default BathroomForm;