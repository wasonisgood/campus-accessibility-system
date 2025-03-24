// src/pages/Register.js

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// 組件導入
import UniversityForm from './UniversityForm';
import BuildingForm from './BuildingForm';
import BathroomForm from './BathroomForm';
import SuccessPage from '../components/SuccessPage';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [universities, setUniversities] = useState([]);

  // 頁面載入時獲取已有的大學列表
  useEffect(() => {
    const fetchUniversities = async () => {
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
      }
    };

    fetchUniversities();
  }, []);

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

  const nextStep = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(prevStep => Math.max(1, prevStep - 1));
  };

  const submitData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 檢查大學是否已存在
      let universityId;
      const universityQuery = query(
        collection(db, "universities"), 
        where("name", "==", formData.university.name)
      );
      const universitySnapshot = await getDocs(universityQuery);
      
      if (universitySnapshot.empty) {
        // 添加新大學
        const universityRef = await addDoc(collection(db, "universities"), formData.university);
        universityId = universityRef.id;
      } else {
        universityId = universitySnapshot.docs[0].id;
      }
      
      // 添加建築物
      const buildingRef = await addDoc(collection(db, "buildings"), {
        ...formData.building,
        universityId
      });
      
      // 添加廁所資訊
      await addDoc(collection(db, "bathrooms"), {
        ...formData.bathroom,
        buildingId: buildingRef.id
      });
      
      setSubmitted(true);
      setCurrentStep(4); // 成功頁面
    } catch (error) {
      console.error("Error submitting data:", error);
      setError("提交數據時發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="error-message" role="alert">{error}</div>;
  }

  // 根據當前步驟渲染不同的表單
  const renderStep = () => {
    switch (currentStep) {
      case 1:
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
      {renderStep()}
    </div>
  );
};

export default Register;