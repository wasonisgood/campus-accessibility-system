// src/pages/Register.js

import React, { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where 
} from '../firebase/firebase';
import { Link } from 'react-router-dom';

// 組件導入
import UniversityForm from '../components/UniversityForm';
import BuildingForm from '../components/BuildingForm';
import BathroomForm from '../components/BathroomForm';
import SuccessPage from '../components/SuccessPage';
import './Register.css';

const Register = () => {
  // 主要狀態
  const [registrationType, setRegistrationType] = useState(null); // 'full', 'building', 'bathroom'
  const [currentStep, setCurrentStep] = useState(0); // 0 表示選擇畫面
  const [formData, setFormData] = useState({
    university: {
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      latitudeDelta: '',
      longitudeDelta: '',
    },
    building: {
      type: '',
      name: '',
      description: '',
      floors: 1,
      hasElevator: false,
    },
    bathroom: {
      hasAccessibleBathroom: false,
      floors: [],
    }
  });
  
  // 資料狀態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [fetchingUniversities, setFetchingUniversities] = useState(true);
  const [fetchingBuildings, setFetchingBuildings] = useState(false);
  const [selectedUniversityId, setSelectedUniversityId] = useState(null);

  // 頁面載入時獲取已有的大學列表
  useEffect(() => {
    const fetchUniversities = async () => {
      setFetchingUniversities(true);
      try {
        const querySnapshot = await getDocs(collection(db, "universities"));
        const universityList = [];
        querySnapshot.forEach((doc) => {
          universityList.push({ id: doc.id, ...doc.data() });
        });
        setUniversities(universityList);
      } catch (error) {
        console.error("Error fetching universities:", error);
        setError("無法獲取大學列表，請稍後再試。");
      } finally {
        setFetchingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  // 當選擇大學ID後，獲取該大學的建築物列表（僅在bathroom模式下使用）
  useEffect(() => {
    if (!selectedUniversityId || registrationType !== 'bathroom') return;

    const fetchBuildings = async () => {
      setFetchingBuildings(true);
      try {
        const buildingsQuery = query(
          collection(db, "buildings"),
          where("universityId", "==", selectedUniversityId)
        );
        
        const querySnapshot = await getDocs(buildingsQuery);
        const buildingsList = [];
        querySnapshot.forEach((doc) => {
          buildingsList.push({ id: doc.id, ...doc.data() });
        });
        
        setBuildings(buildingsList);
      } catch (error) {
        console.error("Error fetching buildings:", error);
        setError("無法獲取建築物列表，請稍後再試。");
      } finally {
        setFetchingBuildings(false);
      }
    };

    fetchBuildings();
  }, [selectedUniversityId, registrationType]);

  // 更新表單數據
  const updateFormData = (step, data) => {
    setFormData(prevData => {
      const newData = { ...prevData };
      switch(step) {
        case 1:
          newData.university = { ...newData.university, ...data };
          break;
        case 2:
          newData.building = { ...newData.building, ...data };
          break;
        case 3:
          newData.bathroom = { ...newData.bathroom, ...data };
          break;
        default:
          break;
      }
      return newData;
    });
  };

  // 導航控制
  const nextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    if (currentStep === 1 && registrationType !== 'full') {
      // 返回選擇類型畫面
      setCurrentStep(0);
      setRegistrationType(null);
    } else {
      setCurrentStep(prevStep => Math.max(1, prevStep - 1));
    }
  };

  // 選擇註冊類型
  const handleSelectRegistrationType = (type) => {
    setRegistrationType(type);
    
    // 根據類型設置起始步驟
    switch(type) {
      case 'full': // 全新註冊（大學+建築物+廁所）
        setCurrentStep(1); // 從大學表單開始
        break;
      case 'building': // 添加建築物（已有大學）
        setCurrentStep(1); // 從選擇大學開始
        break;
      case 'bathroom': // 添加廁所（已有建築物）
        setCurrentStep(1); // 從選擇大學、建築物開始
        break;
      default:
        setCurrentStep(0);
    }
  };

  // 選擇大學和建築物（僅用於bathroom模式）
  const handleSelectUniversity = (universityId) => {
    setSelectedUniversityId(universityId);
    
    // 選擇大學後更新表單數據
    const selectedUniversity = universities.find(uni => uni.id === universityId);
    if (selectedUniversity) {
      updateFormData(1, {
        name: selectedUniversity.name,
        address: selectedUniversity.address,
        id: selectedUniversity.id
      });
    }
    
    // 如果是building模式，選擇大學後直接進入建築物表單
    if (registrationType === 'building') {
      nextStep();
    }
  };

  const handleSelectBuilding = (buildingId) => {
    // 選擇建築物後更新表單數據
    const selectedBuilding = buildings.find(building => building.id === buildingId);
    if (selectedBuilding) {
      updateFormData(2, {
        name: selectedBuilding.name,
        type: selectedBuilding.type,
        floors: selectedBuilding.floors,
        hasElevator: selectedBuilding.hasElevator,
        description: selectedBuilding.description,
        id: selectedBuilding.id
      });
      
      // 直接進入廁所表單
      nextStep();
    }
  };

  // 提交數據
  const submitData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 根據註冊類型執行不同的提交邏輯
      switch(registrationType) {
        case 'full':
          await submitFullRegistration();
          break;
        case 'building':
          await submitBuildingRegistration();
          break;
        case 'bathroom':
          await submitBathroomRegistration();
          break;
        default:
          throw new Error("未知的註冊類型");
      }
      
      setSubmitted(true);
      setCurrentStep(4); // 成功頁面
    } catch (error) {
      console.error("Error submitting data:", error);
      setError("提交數據時發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  // 完整註冊（大學+建築物+廁所）
  const submitFullRegistration = async () => {
    // 檢查大學是否已存在
    let universityId;
    const universityQuery = query(
      collection(db, "universities"), 
      where("name", "==", formData.university.name)
    );
    
    const universitySnapshot = await getDocs(universityQuery);
    
    if (universitySnapshot.empty) {
      // 添加新大學
      const universityRef = await addDoc(
        collection(db, "universities"), 
        formData.university
      );
      universityId = universityRef.id;
    } else {
      universityId = universitySnapshot.docs[0].id;
    }
    
    // 添加建築物
    const buildingRef = await addDoc(
      collection(db, "buildings"), 
      {
        ...formData.building,
        universityId
      }
    );
    
    // 添加廁所資訊
    await addDoc(
      collection(db, "bathrooms"), 
      {
        ...formData.bathroom,
        buildingId: buildingRef.id
      }
    );
  };

  // 建築物註冊（已有大學）
  const submitBuildingRegistration = async () => {
    // 添加建築物
    const buildingRef = await addDoc(
      collection(db, "buildings"), 
      {
        ...formData.building,
        universityId: selectedUniversityId
      }
    );
    
    // 添加廁所資訊
    await addDoc(
      collection(db, "bathrooms"), 
      {
        ...formData.bathroom,
        buildingId: buildingRef.id
      }
    );
  };

  // 廁所註冊（已有建築物）
  const submitBathroomRegistration = async () => {
    // 添加廁所資訊
    await addDoc(
      collection(db, "bathrooms"), 
      {
        ...formData.bathroom,
        buildingId: formData.building.id
      }
    );
  };

  if (fetchingUniversities) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-circle inner"></div>
        </div>
        <p className="loading-text">載入大學數據中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
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
        <button 
          className="btn-primary"
          onClick={() => {
            setError(null);
            setCurrentStep(0);
            setRegistrationType(null);
          }}
        >
          返回
        </button>
      </div>
    );
  }

  // 選擇註冊類型的初始畫面
  if (currentStep === 0) {
    return (
      <div className="register-container">
        <div className="register-header">
          <h1>無障礙設施資料登記</h1>
          <p>請選擇您要進行的操作類型</p>
        </div>
        
        <div className="registration-type-options">
          <div 
            className="registration-option"
            onClick={() => handleSelectRegistrationType('full')}
          >
            <div className="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3>全新登記</h3>
            <p>登記新大學、新建築物的無障礙設施</p>
          </div>
          
          <div 
            className="registration-option"
            onClick={() => handleSelectRegistrationType('building')}
          >
            <div className="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="1" x2="9" y2="4"></line>
                <line x1="15" y1="1" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="23"></line>
                <line x1="15" y1="20" x2="15" y2="23"></line>
                <line x1="20" y1="9" x2="23" y2="9"></line>
                <line x1="20" y1="14" x2="23" y2="14"></line>
                <line x1="1" y1="9" x2="4" y2="9"></line>
                <line x1="1" y1="14" x2="4" y2="14"></line>
              </svg>
            </div>
            <h3>新增建築物</h3>
            <p>為已有大學登記新建築物的無障礙設施</p>
          </div>
          
          <div 
            className="registration-option"
            onClick={() => handleSelectRegistrationType('bathroom')}
          >
            <div className="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>新增廁所資料</h3>
            <p>為已有建築物添加無障礙廁所資料</p>
          </div>
        </div>
        
        <div className="back-to-home">
          <Link to="/" className="btn-secondary">返回首頁</Link>
        </div>
      </div>
    );
  }

  // 選擇大學的畫面（用於building和bathroom模式）
  if ((registrationType === 'building' || registrationType === 'bathroom') && currentStep === 1) {
    return (
      <div className="register-container">
        <div className="register-header">
          <h1>{registrationType === 'building' ? '選擇大學添加建築物' : '選擇大學與建築物'}</h1>
          <p>請選擇已登記的大學{registrationType === 'bathroom' ? '和建築物' : ''}</p>
        </div>
        
        <div className="university-selection">
          <h2>選擇大學</h2>
          
          <div className="university-list">
            {universities.length === 0 ? (
              <div className="no-data-message">
                <p>尚未有任何大學資料</p>
                <button 
                  className="btn-primary"
                  onClick={() => handleSelectRegistrationType('full')}
                >
                  添加第一個大學
                </button>
              </div>
            ) : (
              universities.map(university => (
                <div 
                  key={university.id} 
                  className={`university-item ${selectedUniversityId === university.id ? 'selected' : ''}`}
                  onClick={() => handleSelectUniversity(university.id)}
                >
                  <h3>{university.name}</h3>
                  <p>{university.address}</p>
                  {selectedUniversityId === university.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* 如果是bathroom模式並且已選擇大學，顯示建築物選擇 */}
          {registrationType === 'bathroom' && selectedUniversityId && (
            <div className="building-selection">
              <h2>選擇建築物</h2>
              
              {fetchingBuildings ? (
                <div className="loading-mini">載入建築物資料中...</div>
              ) : (
                <div className="building-list">
                  {buildings.length === 0 ? (
                    <div className="no-data-message">
                      <p>該大學尚未有任何建築物資料</p>
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          setRegistrationType('building');
                          nextStep();
                        }}
                      >
                        添加第一個建築物
                      </button>
                    </div>
                  ) : (
                    buildings.map(building => (
                      <div 
                        key={building.id} 
                        className="building-item"
                        onClick={() => handleSelectBuilding(building.id)}
                      >
                        <div className="building-info">
                          <h3>{building.name}</h3>
                          <span className="building-type">{getBuildingTypeLabel(building.type)}</span>
                          <p>樓層: {building.floors} | 電梯: {building.hasElevator ? '有' : '無'}</p>
                          {building.description && <p className="building-desc">{building.description}</p>}
                        </div>
                        <div className="select-button">
                          選擇
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button className="btn-secondary" onClick={prevStep}>返回</button>
          </div>
        </div>
      </div>
    );
  }

  // 根據當前步驟渲染不同的表單
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // 只有全新註冊需要渲染大學表單
        return (
          <UniversityForm 
            formData={formData.university} 
            updateFormData={(data) => updateFormData(1, data)} 
            nextStep={nextStep}
            universities={universities}
          />
        );
      case 2:
        return (
          <BuildingForm 
            formData={formData.building} 
            updateFormData={(data) => updateFormData(2, data)} 
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <BathroomForm 
            formData={formData.bathroom}
            buildingData={formData.building}
            updateFormData={(data) => updateFormData(3, data)} 
            prevStep={prevStep}
            submitData={submitData}
            loading={loading}
          />
        );
      case 4:
        return (
          <SuccessPage 
            universityName={formData.university.name} 
            buildingName={formData.building.name} 
          />
        );
      default:
        return <div>未知步驟</div>;
    }
  };

  return (
    <div className="register-container">
      {/* 顯示當前註冊類型 */}
      <div className="registration-type-indicator">
        {registrationType === 'full' && <span>全新登記</span>}
        {registrationType === 'building' && <span>新增建築物</span>}
        {registrationType === 'bathroom' && <span>新增廁所資料</span>}
      </div>
      
      {renderStep()}
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

export default Register;