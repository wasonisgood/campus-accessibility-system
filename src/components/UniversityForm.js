import React, { useState } from 'react';
import './UniversityForm.css';

const UniversityForm = ({ formData, updateFormData, nextStep, universities }) => {
  const [errors, setErrors] = useState({});
  const [useExisting, setUseExisting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "請輸入大學名稱";
    if (!formData.address) newErrors.address = "請輸入大學地址";
    if (!formData.latitude) newErrors.latitude = "請輸入緯度";
    if (!formData.longitude) newErrors.longitude = "請輸入經度";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      nextStep();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleExistingUniversity = (e) => {
    const selectedUniversity = universities.find(uni => uni.id === e.target.value);
    if (selectedUniversity) {
      updateFormData(selectedUniversity);
    }
  };

  // 獲取當前位置的函數
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支持地理位置功能');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateFormData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert('用戶拒絕了位置請求');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('位置資訊不可用');
            break;
          case error.TIMEOUT:
            alert('請求超時');
            break;
          case error.UNKNOWN_ERROR:
            alert('發生未知錯誤');
            break;
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="form-container">
      <h2>第一步：大學資訊</h2>
      <p className="form-description">
        請提供大學的基本資訊，這將幫助我們正確地組織和顯示無障礙設施數據。
      </p>

      {universities && universities.length > 0 && (
        <div className="existing-university">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useExisting}
              onChange={() => setUseExisting(!useExisting)}
              aria-label="使用已有的大學"
            />
            從已有列表中選擇大學
          </label>
          
          {useExisting && (
            <div className="select-container">
              <label htmlFor="existingUniversity">選擇大學：</label>
              <select 
                id="existingUniversity" 
                onChange={handleExistingUniversity}
                aria-label="選擇已有的大學"
              >
                <option value="">-- 請選擇 --</option>
                {universities.map(uni => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">
            大學名稱 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className={errors.name ? "error" : ""}
            aria-required="true"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
            disabled={useExisting}
          />
          {errors.name && (
            <span id="name-error" className="error-message" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="address">
            大學地址 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            className={errors.address ? "error" : ""}
            aria-required="true"
            aria-invalid={errors.address ? "true" : "false"}
            aria-describedby={errors.address ? "address-error" : undefined}
            disabled={useExisting}
          />
          {errors.address && (
            <span id="address-error" className="error-message" role="alert">
              {errors.address}
            </span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="latitude">
              緯度 <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                type="number"
                step="0.000001"
                id="latitude"
                name="latitude"
                value={formData.latitude || ''}
                onChange={handleChange}
                className={errors.latitude ? "error" : ""}
                aria-required="true"
                aria-invalid={errors.latitude ? "true" : "false"}
                aria-describedby={errors.latitude ? "latitude-error" : undefined}
                disabled={useExisting}
              />
              {errors.latitude && (
                <span id="latitude-error" className="error-message" role="alert">
                  {errors.latitude}
                </span>
              )}
            </div>
          </div>

          <div className="form-group half">
            <label htmlFor="longitude">
              經度 <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                type="number"
                step="0.000001"
                id="longitude"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleChange}
                className={errors.longitude ? "error" : ""}
                aria-required="true"
                aria-invalid={errors.longitude ? "true" : "false"}
                aria-describedby={errors.longitude ? "longitude-error" : undefined}
                disabled={useExisting}
              />
              {errors.longitude && (
                <span id="longitude-error" className="error-message" role="alert">
                  {errors.longitude}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 添加一個獲取當前位置的按鈕 */}
        <div className="form-group">
          <button 
            type="button" 
            onClick={getCurrentLocation} 
            className="location-btn"
            disabled={useExisting || isGettingLocation}
            aria-label="獲取當前位置"
            aria-live="polite"
          >
            {isGettingLocation ? (
              <span role="status">正在獲取位置...</span>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  width="16" 
                  height="16" 
                  className="location-icon"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                </svg>
                獲取當前位置
              </>
            )}
          </button>
          <span className="help-text">點擊以使用您當前位置的經緯度</span>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="latitudeDelta">
              緯度範圍
            </label>
            <input
              type="number"
              step="0.001"
              id="latitudeDelta"
              name="latitudeDelta"
              value={formData.latitudeDelta || ''}
              onChange={handleChange}
              placeholder="選填"
              disabled={useExisting}
            />
            <small>校園緯度範圍，用於地圖顯示</small>
          </div>

          <div className="form-group half">
            <label htmlFor="longitudeDelta">
              經度範圍
            </label>
            <input
              type="number"
              step="0.001"
              id="longitudeDelta"
              name="longitudeDelta"
              value={formData.longitudeDelta || ''}
              onChange={handleChange}
              placeholder="選填"
              disabled={useExisting}
            />
            <small>校園經度範圍，用於地圖顯示</small>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            下一步
          </button>
        </div>
      </form>

      <div className="help-text">
        <h3>如何獲取經緯度？</h3>
        <div className="help-steps">
          <p>您可以使用以下方法獲取大學的經緯度：</p>
          <ol>
            <li>點擊上方的「獲取當前位置」按鈕，使用您當前的位置</li>
            <li>或者在 Google 地圖中搜索大學名稱</li>
            <li>右鍵點擊大學位置</li>
            <li>選擇「這是什麼地方？」</li>
            <li>在底部卡片中查看經緯度數值</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default UniversityForm;