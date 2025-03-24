// src/pages/EditBuilding.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, doc, getDoc, updateDoc } from '../firebase/firebase';
import './EditBuilding.css';

const EditBuilding = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    floors: 1,
    hasElevator: false,
    universityId: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [universityName, setUniversityName] = useState('');

  const buildingTypes = [
    { value: 'dormitory', label: '宿舍' },
    { value: 'cafeteria', label: '餐廳' },
    { value: 'venue', label: '大型場館' },
    { value: 'academic', label: '教學大樓' },
    { value: 'office', label: '辦公大樓' },
    { value: 'library', label: '圖書館' },
    { value: 'other', label: '其他' }
  ];

  // 獲取建築物數據
  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const buildingRef = doc(db, 'buildings', id);
        const buildingDoc = await getDoc(buildingRef);
        
        if (!buildingDoc.exists()) {
          setError('找不到該建築物的資訊');
          setLoading(false);
          return;
        }
        
        const buildingData = buildingDoc.data();
        setFormData({
          type: buildingData.type || '',
          name: buildingData.name || '',
          description: buildingData.description || '',
          floors: buildingData.floors || 1,
          hasElevator: buildingData.hasElevator || false,
          universityId: buildingData.universityId || ''
        });

        // 獲取大學名稱
        if (buildingData.universityId) {
          const universityRef = doc(db, 'universities', buildingData.universityId);
          const universityDoc = await getDoc(universityRef);
          if (universityDoc.exists()) {
            setUniversityName(universityDoc.data().name || '未知大學');
          }
        }
      } catch (error) {
        console.error('Error fetching building:', error);
        setError('獲取建築物資訊時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchBuilding();
  }, [id]);

  // 處理表單變更
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 處理樓層數變更
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1) {
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const buildingRef = doc(db, 'buildings', id);
      await updateDoc(buildingRef, formData);
      setSuccess(true);
      
      // 延遲後返回建築物詳情頁
      setTimeout(() => {
        navigate(`/building/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating building:', error);
      setError('更新建築物資訊時發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-container">載入中...</div>;
  }

  if (error && !formData.name) {
    return (
      <div className="error-container" role="alert">
        <p>{error}</p>
        <Link to="/" className="btn-primary">返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="edit-building-container">
      <h2>編輯建築物資訊</h2>
      {universityName && (
        <p className="university-info">
          所屬大學: <Link to={`/university/${formData.universityId}`}>{universityName}</Link>
        </p>
      )}
      
      {success && (
        <div className="success-message" role="alert">
          建築物資訊更新成功！正在返回詳情頁...
        </div>
      )}
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label htmlFor="type">
            建築物類型 <span className="required">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="">-- 請選擇 --</option>
            {buildingTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="name">
            建築物名稱 <span className="required">*</span>
          </label>
          <Link to={`/edit/building/${id}`} className="btn-secondary btn-sm">
      編輯
    </Link>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="例如：第一教學樓、綜合大樓、學生宿舍A棟"
          />
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
            disabled={submitting}
            placeholder="請簡要描述該建築物的主要功能、特點等資訊（選填）"
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
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group half checkbox-group">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="hasElevator"
                name="hasElevator"
                checked={formData.hasElevator}
                onChange={handleChange}
                disabled={submitting}
                aria-label="建築物是否有電梯"
              />
              <label htmlFor="hasElevator" className="checkbox-label">
                建築物有電梯
              </label>
            </div>
            <small>如果建築物有可用的電梯，請勾選此項</small>
          </div>
        </div>

        <div className="form-actions">
          <Link 
            to={`/building/${id}`} 
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
            {submitting ? '更新中...' : '更新建築物資訊'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBuilding;