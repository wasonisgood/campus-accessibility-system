// src/pages/EditUniversity.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, doc, getDoc, updateDoc } from '../firebase/firebase';
import './EditUniversity.css';

const EditUniversity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    latitudeDelta: '',
    longitudeDelta: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 獲取大學數據
  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        const universityRef = doc(db, 'universities', id);
        const universityDoc = await getDoc(universityRef);
        
        if (!universityDoc.exists()) {
          setError('找不到該大學的資訊');
          setLoading(false);
          return;
        }
        
        const universityData = universityDoc.data();
        setFormData({
          name: universityData.name || '',
          address: universityData.address || '',
          latitude: universityData.latitude || '',
          longitude: universityData.longitude || '',
          latitudeDelta: universityData.latitudeDelta || '',
          longitudeDelta: universityData.longitudeDelta || '',
        });
      } catch (error) {
        console.error('Error fetching university:', error);
        setError('獲取大學資訊時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversity();
  }, [id]);

  // 處理表單變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const universityRef = doc(db, 'universities', id);
      await updateDoc(universityRef, formData);
      setSuccess(true);
      
      // 延遲後返回大學詳情頁
      setTimeout(() => {
        navigate(`/university/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating university:', error);
      setError('更新大學資訊時發生錯誤');
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
    <div className="edit-university-container">
      <h2>編輯大學資訊</h2>
      
      {success && (
        <div className="success-message" role="alert">
          大學資訊更新成功！正在返回詳情頁...
        </div>
      )}
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label htmlFor="name">
            大學名稱 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">
            大學地址 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="latitude">
              緯度 <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group half">
            <label htmlFor="longitude">
              經度 <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
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
              value={formData.latitudeDelta}
              onChange={handleChange}
              placeholder="選填"
              disabled={submitting}
            />
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
              value={formData.longitudeDelta}
              onChange={handleChange}
              placeholder="選填"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="form-actions">
          <Link 
            to={`/university/${id}`} 
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
            {submitting ? '更新中...' : '更新大學資訊'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUniversity;