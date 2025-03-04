import React, { useState } from 'react';
import './BuildingForm.css';

const BuildingForm = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});

  const buildingTypes = [
    { value: 'dormitory', label: '宿舍' },
    { value: 'cafeteria', label: '餐廳' },
    { value: 'venue', label: '大型場館' },
    { value: 'academic', label: '教學大樓' },
    { value: 'office', label: '辦公大樓' },
    { value: 'library', label: '圖書館' },
    { value: 'other', label: '其他' }
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = "請選擇建築物類型";
    if (!formData.name) newErrors.name = "請輸入建築物名稱";
    if (!formData.floors || formData.floors < 1) newErrors.floors = "請輸入有效的樓層數";
    
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
    const { name, value, type, checked } = e.target;
    updateFormData({ 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1) {
      updateFormData({ [name]: numValue });
    }
  };

  // 根據勾選狀態返回「有」或「沒有」
  const getStatusText = (isChecked) => {
    return isChecked ? '有' : '沒有';
  };

  return (
    <div className="form-container">
      <h2>第二步：建築物信息</h2>
      <p className="form-description">
        請提供建築物的詳細信息，這將幫助我們了解建築物的基本結構和無障礙設施的分佈情況。
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="type">
            建築物類型 <span className="required">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={errors.type ? "error" : ""}
            aria-required="true"
            aria-invalid={errors.type ? "true" : "false"}
            aria-describedby={errors.type ? "type-error" : undefined}
          >
            <option value="">-- 請選擇 --</option>
            {buildingTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <span id="type-error" className="error-message" role="alert">
              {errors.type}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="name">
            建築物名稱 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "error" : ""}
            aria-required="true"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="例如：第一教學樓、綜合大樓、學生宿舍A棟"
          />
          {errors.name && (
            <span id="name-error" className="error-message" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">
            建築物簡介
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows="3"
            placeholder="請簡要描述該建築物的主要功能、特點等信息（選填）"
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="floors">
              樓層數 <span className="required">*</span>
            </label>
            <input
              type="number"
              id="floors"
              name="floors"
              min="1"
              value={formData.floors}
              onChange={handleNumberChange}
              className={errors.floors ? "error" : ""}
              aria-required="true"
              aria-invalid={errors.floors ? "true" : "false"}
              aria-describedby={errors.floors ? "floors-error" : undefined}
            />
            {errors.floors && (
              <span id="floors-error" className="error-message" role="alert">
                {errors.floors}
              </span>
            )}
          </div>

          <div className="form-group half checkbox-group">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="hasElevator"
                name="hasElevator"
                checked={formData.hasElevator}
                onChange={handleChange}
                aria-label="建築物是否有電梯"
              />
              <label htmlFor="hasElevator" className="checkbox-label">
                建築物有電梯
                <span className="status-text">
                  {getStatusText(formData.hasElevator)}
                </span>
              </label>
            </div>
            <small>如果建築物有可用的電梯，請勾選此項</small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={prevStep}>
            上一步
          </button>
          <button type="submit" className="btn-primary">
            下一步
          </button>
        </div>
      </form>

      <div className="help-text">
        <h3>填寫提示</h3>
        <ul>
          <li>請確保提供準確的樓層數，這將影響後續無障礙設施的登記</li>
          <li>電梯的存在與否對行動不便人士非常重要，請務必準確勾選</li>
          <li>在簡介中可以提供有助於識別此建築物的獨特特徵</li>
        </ul>
      </div>
    </div>
  );
};

export default BuildingForm;