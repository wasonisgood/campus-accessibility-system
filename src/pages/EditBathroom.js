// src/pages/EditBathroom.js

import React, { useState, useEffect, useRef } from 'react';
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
  
  // 照片上傳相關狀態
  const [photoUploads, setPhotoUploads] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const fileInputRefs = useRef({});

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
                  issues: { usedAsStorage: false, needsRenovation: false },
                  toiletPaper: { improperPlacement: false },
                  rotationSpace: { insufficient: false }
                },
                photos: {}
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
              
              // 新增和其他特徵
              toilet: floor.features?.toilet || { properHeight: false },
              doorType: floor.features?.doorType || { value: '向外開門' },
              innerSpace: floor.features?.innerSpace || { adequate: false },
              emergencyCall: floor.features?.emergencyCall || { exists: false },
              floor: floor.features?.floor || { nonSlip: false },
              threshold: floor.features?.threshold || { none: false },
              pathway: floor.features?.pathway || { adequate: false },
              signage: floor.features?.signage || { clear: false },
              lighting: floor.features?.lighting || { adequate: false },
              issues: floor.features?.issues || { usedAsStorage: false, needsRenovation: false },
              toiletPaper: floor.features?.toiletPaper || { improperPlacement: false },
              rotationSpace: floor.features?.rotationSpace || { insufficient: false }
            },
            photos: floor.photos || {}
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
                    issues: { usedAsStorage: false, needsRenovation: false },
                    toiletPaper: { improperPlacement: false },
                    rotationSpace: { insufficient: false }
                  },
                  photos: {}
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
          setError('找不到相關建築物的資訊');
        }
      } catch (error) {
        console.error('Error fetching bathroom data:', error);
        setError('獲取廁所資訊時發生錯誤');
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

  // 判斷是否需要照片上傳
  const needsPhotoUpload = (floorIndex, featureKey) => {
    const floor = formData.floors[floorIndex];
    if (!floor?.features) return false;
    
    // 根據不同的問題類型判斷是否需要照片
    switch(featureKey) {
      case 'doorWidth':
        return !floor.features.doorWidth?.adequate;
      case 'innerSpace':
        return !floor.features.innerSpace?.adequate;
      case 'rotationSpace':
        return floor.features.rotationSpace?.insufficient;
      case 'doorLock':
        return !floor.features.doorLock?.functional;
      case 'toilet':
        return !floor.features.toilet?.properHeight;
      case 'handrails':
        return !floor.features.handrails?.exists;
      case 'sink':
        return !floor.features.sink?.exists || !floor.features.sink?.accessible;
      case 'toiletPaper':
        return floor.features.toiletPaper?.improperPlacement;
      case 'emergencyCall':
        return !floor.features.emergencyCall?.exists;
      case 'usedAsStorage':
        return floor.features.issues?.usedAsStorage;
      case 'needsRenovation':
        return floor.features.issues?.needsRenovation;
      case 'otherIssues':
        return !!floor.features.issues?.otherIssues;
      default:
        return false;
    }
  };

  // 處理照片選擇
  const handlePhotoSelect = (floorIndex, featureKey, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      setUploadErrors({
        ...uploadErrors,
        [`${floorIndex}-${featureKey}`]: '請選擇圖片文件'
      });
      return;
    }
    
    // 檢查文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors({
        ...uploadErrors,
        [`${floorIndex}-${featureKey}`]: '圖片大小不能超過 5MB'
      });
      return;
    }
    
    // 保存文件以便上傳
    setPhotoUploads({
      ...photoUploads,
      [`${floorIndex}-${featureKey}`]: file
    });
    
    // 清除錯誤
    const newErrors = {...uploadErrors};
    delete newErrors[`${floorIndex}-${featureKey}`];
    setUploadErrors(newErrors);
    
    // 顯示預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      const updatedFloors = [...formData.floors];
      updatedFloors[floorIndex].photos = {
        ...updatedFloors[floorIndex].photos,
        [featureKey]: { preview: e.target.result, uploaded: false }
      };
      
      setFormData(prev => ({
        ...prev,
        floors: updatedFloors
      }));
    };
    reader.readAsDataURL(file);
  };

  // 上傳照片到imgBB
  const uploadPhotoToImgBB = async (floorIndex, featureKey, file) => {
    try {
      const uploadKey = `${floorIndex}-${featureKey}`;
      
      // 創建FormData對象
      const formData = new FormData();
      formData.append('image', file);
      
      // 使用imgBB API上傳
      // 注意：請替換為您自己的imgBB API密鑰
      const apiKey = 'd433cff852f523dc27963d505ba6c413';
      const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;
      
      // 使用fetch上傳
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      
      // 設置進度監聽
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({
            ...prev,
            [uploadKey]: progress
          }));
        }
      };
      
      // 返回上傳Promise
      return new Promise((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              // 上傳成功，更新表單數據
              const updatedFloors = [...formData.floors];
              updatedFloors[floorIndex].photos = {
                ...updatedFloors[floorIndex].photos,
                [featureKey]: response.data.url
              };
              
              setFormData(prev => ({
                ...prev,
                floors: updatedFloors
              }));
              
              resolve(response.data.url);
            } else {
              reject(new Error('上傳失敗'));
            }
          } else {
            reject(new Error('上傳失敗'));
          }
        };
        
        xhr.onerror = () => reject(new Error('網絡錯誤'));
        xhr.send(formData);
      });
    } catch (error) {
      console.error(`Error uploading photo for floor ${floorIndex}, feature ${featureKey}:`, error);
      setUploadErrors(prev => ({
        ...prev,
        [`${floorIndex}-${featureKey}`]: '上傳失敗: ' + error.message
      }));
      throw error;
    }
  };

  // 測試用的模擬上傳函數 (真實環境請使用上面的uploadPhotoToImgBB)
  const mockUploadPhoto = async (floorIndex, featureKey, file) => {
    const uploadKey = `${floorIndex}-${featureKey}`;
    
    // 模擬進度條
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({
          ...prev,
          [uploadKey]: progress
        }));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // 讀取文件創建臨時URL (在真實情況下這會是imgBB返回的URL)
          const reader = new FileReader();
          reader.onload = (e) => {
            const updatedFloors = [...formData.floors];
            updatedFloors[floorIndex].photos = {
              ...updatedFloors[floorIndex].photos,
              [featureKey]: e.target.result
            };
            
            setFormData(prev => ({
              ...prev,
              floors: updatedFloors
            }));
            
            resolve(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      }, 200);
    });
  };

  // 刪除照片
  const handleRemovePhoto = (floorIndex, featureKey) => {
    // 複製當前樓層數據
    const updatedFloors = [...formData.floors];
    
    // 刪除照片
    const photos = {...updatedFloors[floorIndex].photos};
    delete photos[featureKey];
    updatedFloors[floorIndex].photos = photos;
    
    // 清除上傳狀態
    const uploadKey = `${floorIndex}-${featureKey}`;
    const newUploads = {...photoUploads};
    delete newUploads[uploadKey];
    
    const newProgress = {...uploadProgress};
    delete newProgress[uploadKey];
    
    const newErrors = {...uploadErrors};
    delete newErrors[uploadKey];
    
    // 更新狀態
    setFormData(prev => ({
      ...prev,
      floors: updatedFloors
    }));
    setPhotoUploads(newUploads);
    setUploadProgress(newProgress);
    setUploadErrors(newErrors);
  };

  // 觸發文件選擇
  const triggerFileInput = (floorIndex, featureKey) => {
    if (fileInputRefs.current[`${floorIndex}-${featureKey}`]) {
      fileInputRefs.current[`${floorIndex}-${featureKey}`].click();
    }
  };

  // 檢查是否有需要上傳但尚未上傳的照片
  const hasPendingUploads = () => {
    for (const floorIndex in formData.floors) {
      const floor = formData.floors[floorIndex];
      if (!floor.hasAccessible) continue;
      
      const features = floor.features;
      if (!features) continue;
      
      // 檢查是否有問題需要上傳照片
      const needsPhotos = (
        (!features.doorWidth?.adequate) ||
        (!features.innerSpace?.adequate) ||
        (features.rotationSpace?.insufficient) ||
        (!features.doorLock?.functional) ||
        (!features.toilet?.properHeight) ||
        (!features.handrails?.exists) ||
        (!features.sink?.exists || !features.sink?.accessible) ||
        (features.toiletPaper?.improperPlacement) ||
        (!features.emergencyCall?.exists) ||
        (features.issues?.usedAsStorage) ||
        (features.issues?.needsRenovation) ||
        (features.issues?.otherIssues)
      );
      
      if (needsPhotos) {
        // 檢查是否已有照片
        const hasPhotos = floor.photos && Object.keys(floor.photos).length > 0;
        if (!hasPhotos) return true;
      }
    }
    
    return false;
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // 處理所有待上傳的照片
      for (const [key, file] of Object.entries(photoUploads)) {
        const [floorIndex, featureKey] = key.split('-');
        
        // 檢查是否已上傳 (已有URL)
        const floor = formData.floors[floorIndex];
        const photoUrl = floor.photos ? floor.photos[featureKey] : null;
        
        // 如果不是字符串URL (而是預覽對象)，則需要上傳
        if (photoUrl && typeof photoUrl !== 'string') {
          // 使用imgBB上傳 (或模擬上傳)
          try {
            await mockUploadPhoto(Number(floorIndex), featureKey, file);
          } catch (error) {
            // 上傳失敗，但繼續處理其他照片
            console.error(`Failed to upload photo for floor ${floorIndex}, feature ${featureKey}:`, error);
          }
        }
      }
      
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
      setError('更新廁所資訊時發生錯誤: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 檢查是否有缺少照片的樓層
  const checkMissingPhotos = () => {
    const missingPhotoFloors = [];
    
    formData.floors.forEach((floor, index) => {
      if (!floor.hasAccessible) return;
      
      const hasIssues = (
        (!floor.features.doorWidth?.adequate) ||
        (!floor.features.innerSpace?.adequate) ||
        (floor.features.rotationSpace?.insufficient) ||
        (!floor.features.doorLock?.functional) ||
        (!floor.features.toilet?.properHeight) ||
        (!floor.features.handrails?.exists) ||
        (!floor.features.sink?.exists || !floor.features.sink?.accessible) ||
        (floor.features.toiletPaper?.improperPlacement) ||
        (!floor.features.emergencyCall?.exists) ||
        (floor.features.issues?.usedAsStorage) ||
        (floor.features.issues?.needsRenovation) ||
        (floor.features.issues?.otherIssues)
      );
      
      if (hasIssues) {
        const hasPhotos = floor.photos && Object.keys(floor.photos).length > 0;
        if (!hasPhotos) {
          missingPhotoFloors.push(index + 1);
        }
      }
    });
    
    return missingPhotoFloors;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-circle inner"></div>
        </div>
        <p className="loading-text">載入廁所資訊中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
      </div>
    );
  }

  if (error && !buildingData) {
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

  const missingPhotoFloors = checkMissingPhotos();

  return (
    <div className="edit-bathroom-container">
      <div className="page-header">
        <h2>編輯無障礙廁所資訊</h2>
        {buildingData && (
          <p className="building-info">
            所屬建築物: <Link to={`/building/${formData.buildingId}`}>{buildingData.name}</Link>
          </p>
        )}
      </div>
      
      {success && (
        <div className="success-message" role="alert">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>廁所資訊更新成功！正在返回詳情頁...</span>
        </div>
      )}
      
      {error && (
        <div className="error-message" role="alert">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {missingPhotoFloors.length > 0 && (
        <div className="photos-missing-alert">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <div>
            <p>以下樓層有問題需要上傳照片：</p>
            <p className="missing-floors">{missingPhotoFloors.join('、')} 樓</p>
          </div>
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
              <div key={`floor-${index}`} className={`floor-section ${floor.hasAccessible ? 'has-accessible' : ''}`}>
                <div className="floor-header">
                  <h4>
                    {index + 1} 樓
                    {buildingData && !buildingData.hasElevator && index > 0 && (
                      <span className="no-elevator-badge">
                        無電梯
                      </span>
                    )}
                  </h4>
                  
                  <div className="floor-accessible-toggle">
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
                </div>

                {shouldShowAccessibleDetails(index) && (
                  <div className="accessible-details">
                    {/* 1. 空間與尺寸 */}
                    <div className="feature-section">
                      <h5>🚪 空間與尺寸</h5>
                      
                      {/* 門寬相關選項 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>門寬</h6>
                          {needsPhotoUpload(index, 'doorWidth') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'doorWidth') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-doorWidth`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'doorWidth', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.doorWidth ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.doorWidth === 'string' 
                                      ? floor.photos.doorWidth 
                                      : floor.photos.doorWidth.preview}
                                    alt={`${index+1}樓門寬照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'doorWidth')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">門寬照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'doorWidth')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳門寬照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-doorWidth`] > 0 && uploadProgress[`${index}-doorWidth`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-doorWidth`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-doorWidth`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-doorWidth`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-doorWidth`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 門類型 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>開門方式</h6>
                        </div>
                        
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
                        <div className="feature-header">
                          <h6>內部迴轉空間</h6>
                          {needsPhotoUpload(index, 'innerSpace') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 旋轉空間不足問題 */}
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-rotationSpace-insufficient`}
                              name="features.rotationSpace.insufficient"
                              checked={floor.features?.rotationSpace?.insufficient || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓無障礙廁所旋轉空間是否不足`}
                            />
                            <label htmlFor={`floor-${index}-rotationSpace-insufficient`} className="checkbox-label">
                              旋轉空間不足1.5公尺
                            </label>
                          </div>
                        </div>
                        
                        {floor.features?.rotationSpace?.insufficient && (
                          <div className="form-group">
                            <label htmlFor={`floor-${index}-rotationSpace-difference`}>
                              差距約多少公分
                            </label>
                            <input
                              type="number"
                              id={`floor-${index}-rotationSpace-difference`}
                              name="features.rotationSpace.difference"
                              value={floor.features?.rotationSpace?.difference || ''}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              placeholder="例如: 40"
                              min="1"
                              max="100"
                            />
                          </div>
                        )}
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'innerSpace') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-innerSpace`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'innerSpace', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.innerSpace ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.innerSpace === 'string' 
                                      ? floor.photos.innerSpace 
                                      : floor.photos.innerSpace.preview}
                                    alt={`${index+1}樓內部空間照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'innerSpace')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">內部空間照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'innerSpace')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳內部空間照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-innerSpace`] > 0 && uploadProgress[`${index}-innerSpace`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-innerSpace`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-innerSpace`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-innerSpace`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-innerSpace`]}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* 旋轉空間照片 */}
                        {floor.features?.rotationSpace?.insufficient && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-rotationSpace`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'rotationSpace', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.rotationSpace ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.rotationSpace === 'string' 
                                      ? floor.photos.rotationSpace 
                                      : floor.photos.rotationSpace.preview}
                                    alt={`${index+1}樓旋轉空間不足照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'rotationSpace')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">旋轉空間不足照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'rotationSpace')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳旋轉空間不足照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-rotationSpace`] > 0 && uploadProgress[`${index}-rotationSpace`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-rotationSpace`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-rotationSpace`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-rotationSpace`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-rotationSpace`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 門鎖資訊 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>門鎖</h6>
                          {needsPhotoUpload(index, 'doorLock') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'doorLock') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-doorLock`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'doorLock', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.doorLock ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.doorLock === 'string' 
                                      ? floor.photos.doorLock 
                                      : floor.photos.doorLock.preview}
                                    alt={`${index+1}樓門鎖照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'doorLock')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">門鎖照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'doorLock')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳門鎖照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-doorLock`] > 0 && uploadProgress[`${index}-doorLock`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-doorLock`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-doorLock`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-doorLock`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-doorLock`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 2. 無障礙設施 */}
                    <div className="feature-section">
                      <h5>🚻 無障礙設施</h5>
                      
                      {/* 馬桶資訊 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>馬桶</h6>
                          {needsPhotoUpload(index, 'toilet') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'toilet') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-toilet`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'toilet', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.toilet ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.toilet === 'string' 
                                      ? floor.photos.toilet 
                                      : floor.photos.toilet.preview}
                                    alt={`${index+1}樓馬桶照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'toilet')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">馬桶照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'toilet')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳馬桶照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-toilet`] > 0 && uploadProgress[`${index}-toilet`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-toilet`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-toilet`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-toilet`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-toilet`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 衛生紙擺放問題 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>衛生紙</h6>
                          {floor.features?.toiletPaper?.improperPlacement && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
                        <div className="form-group checkbox-group">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              id={`floor-${index}-toiletPaper-improperPlacement`}
                              name="features.toiletPaper.improperPlacement"
                              checked={floor.features?.toiletPaper?.improperPlacement || false}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              aria-label={`${index + 1}樓衛生紙擺放是否不當`}
                            />
                            <label htmlFor={`floor-${index}-toiletPaper-improperPlacement`} className="checkbox-label">
                              衛生紙擺放位置不當
                            </label>
                          </div>
                        </div>
                        
                        {floor.features?.toiletPaper?.improperPlacement && (
                          <div className="form-group">
                            <label htmlFor={`floor-${index}-toiletPaper-placementDescription`}>
                              位置問題描述
                            </label>
                            <input
                              type="text"
                              id={`floor-${index}-toiletPaper-placementDescription`}
                              name="features.toiletPaper.placementDescription"
                              value={floor.features?.toiletPaper?.placementDescription || ''}
                              onChange={(e) => handleFloorChange(index, e)}
                              disabled={submitting}
                              placeholder="例如: 太遠、太高"
                            />
                          </div>
                        )}
                        
                        {/* 上傳照片區域 */}
                        {floor.features?.toiletPaper?.improperPlacement && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-toiletPaper`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'toiletPaper', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.toiletPaper ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.toiletPaper === 'string' 
                                      ? floor.photos.toiletPaper 
                                      : floor.photos.toiletPaper.preview}
                                    alt={`${index+1}樓衛生紙擺放照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'toiletPaper')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">衛生紙擺放照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'toiletPaper')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳衛生紙擺放照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-toiletPaper`] > 0 && uploadProgress[`${index}-toiletPaper`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-toiletPaper`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-toiletPaper`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-toiletPaper`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-toiletPaper`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 扶手資訊 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>扶手</h6>
                          {needsPhotoUpload(index, 'handrails') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                                placeholder="可以描述扶手的材質、狀態等資訊"
                                rows="2"
                              />
                            </div>
                          </>
                        )}
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'handrails') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-handrails`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'handrails', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.handrails ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.handrails === 'string' 
                                      ? floor.photos.handrails 
                                      : floor.photos.handrails.preview}
                                    alt={`${index+1}樓扶手照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'handrails')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">扶手照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'handrails')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳扶手照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-handrails`] > 0 && uploadProgress[`${index}-handrails`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-handrails`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-handrails`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-handrails`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-handrails`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 洗手台資訊 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>洗手台</h6>
                          {needsPhotoUpload(index, 'sink') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                                placeholder="可以描述洗手台的高度、水龍頭類型等資訊"
                                rows="2"
                              />
                            </div>
                          </>
                        )}
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'sink') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-sink`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'sink', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.sink ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.sink === 'string' 
                                      ? floor.photos.sink 
                                      : floor.photos.sink.preview}
                                    alt={`${index+1}樓洗手台照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'sink')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">洗手台照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'sink')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳洗手台照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-sink`] > 0 && uploadProgress[`${index}-sink`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-sink`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-sink`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-sink`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-sink`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 緊急求助鈴資訊 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>緊急求助鈴</h6>
                          {needsPhotoUpload(index, 'emergencyCall') && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 上傳照片區域 */}
                        {needsPhotoUpload(index, 'emergencyCall') && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-emergencyCall`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'emergencyCall', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.emergencyCall ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.emergencyCall === 'string' 
                                      ? floor.photos.emergencyCall 
                                      : floor.photos.emergencyCall.preview}
                                    alt={`${index+1}樓緊急求助鈴照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'emergencyCall')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">緊急求助鈴照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'emergencyCall')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳緊急求助鈴照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-emergencyCall`] > 0 && uploadProgress[`${index}-emergencyCall`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-emergencyCall`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-emergencyCall`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-emergencyCall`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-emergencyCall`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 3. 地面與通道 */}
                    <div className="feature-section">
                      <h5>🛣️ 地面與通道</h5>
                      
                      {/* 防滑地板 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>防滑地板</h6>
                        </div>
                        
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
                        <div className="feature-header">
                          <h6>門檻設計</h6>
                        </div>
                        
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
                        <div className="feature-header">
                          <h6>通道寬度</h6>
                        </div>
                        
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
                        <div className="feature-header">
                          <h6>無障礙標誌</h6>
                        </div>
                        
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
                        <div className="feature-header">
                          <h6>照明</h6>
                        </div>
                        
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
                        <div className="feature-header">
                          <h6>用途變更</h6>
                          {floor.features?.issues?.usedAsStorage && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 上傳照片區域 */}
                        {floor.features?.issues?.usedAsStorage && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-usedAsStorage`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'usedAsStorage', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.usedAsStorage ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.usedAsStorage === 'string' 
                                      ? floor.photos.usedAsStorage 
                                      : floor.photos.usedAsStorage.preview}
                                    alt={`${index+1}樓被用作儲藏室照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'usedAsStorage')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">用途變更照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'usedAsStorage')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳用途變更照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-usedAsStorage`] > 0 && uploadProgress[`${index}-usedAsStorage`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-usedAsStorage`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-usedAsStorage`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-usedAsStorage`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-usedAsStorage`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 老舊需整修 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>整修需求</h6>
                          {floor.features?.issues?.needsRenovation && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
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
                        
                        {/* 上傳照片區域 */}
                        {floor.features?.issues?.needsRenovation && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-needsRenovation`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'needsRenovation', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.needsRenovation ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.needsRenovation === 'string' 
                                      ? floor.photos.needsRenovation 
                                      : floor.photos.needsRenovation.preview}
                                    alt={`${index+1}樓需要整修照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'needsRenovation')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">需要整修照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'needsRenovation')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳需要整修照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-needsRenovation`] > 0 && uploadProgress[`${index}-needsRenovation`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-needsRenovation`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-needsRenovation`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-needsRenovation`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-needsRenovation`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 其他問題 */}
                      <div className="sub-feature">
                        <div className="feature-header">
                          <h6>其他問題</h6>
                          {floor.features?.issues?.otherIssues && (
                            <div className="photo-requirement">需要上傳照片</div>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor={`floor-${index}-issues-otherIssues`}>
                            其他問題描述
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
                        
                        {/* 上傳照片區域 */}
                        {floor.features?.issues?.otherIssues && (
                          <div className="photo-upload-section">
                            <input
                              type="file"
                              accept="image/*"
                              ref={el => fileInputRefs.current[`${index}-otherIssues`] = el}
                              onChange={(e) => handlePhotoSelect(index, 'otherIssues', e)}
                              style={{ display: 'none' }}
                            />
                            
                            {floor.photos && floor.photos.otherIssues ? (
                              <div className="photo-preview-container">
                                <div className="photo-preview">
                                  <img 
                                    src={typeof floor.photos.otherIssues === 'string' 
                                      ? floor.photos.otherIssues 
                                      : floor.photos.otherIssues.preview}
                                    alt={`${index+1}樓其他問題照片`}
                                  />
                                  <button 
                                    type="button" 
                                    className="remove-photo-btn"
                                    onClick={() => handleRemovePhoto(index, 'otherIssues')}
                                    aria-label="移除照片"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="photo-caption">其他問題照片</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="photo-upload-btn"
                                onClick={() => triggerFileInput(index, 'otherIssues')}
                                disabled={submitting}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                  <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                上傳其他問題照片
                              </button>
                            )}
                            
                            {uploadProgress[`${index}-otherIssues`] > 0 && uploadProgress[`${index}-otherIssues`] < 100 && (
                              <div className="upload-progress">
                                <div 
                                  className="progress-bar" 
                                  style={{width: `${uploadProgress[`${index}-otherIssues`]}%`}}
                                ></div>
                                <span className="progress-text">{uploadProgress[`${index}-otherIssues`]}%</span>
                              </div>
                            )}
                            
                            {uploadErrors[`${index}-otherIssues`] && (
                              <div className="upload-error">
                                {uploadErrors[`${index}-otherIssues`]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="submit-warning">
          {hasPendingUploads() && (
            <div className="warning-message">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>你有問題尚未上傳照片，建議上傳照片以便更清楚記錄。</span>
            </div>
          )}
        </div>

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
            {submitting ? (
              <>
                <span className="spinner"></span>
                處理中...
              </>
            ) : '更新廁所資訊'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBathroom;