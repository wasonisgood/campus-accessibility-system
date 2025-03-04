// src/pages/Home.js

import React, { useState, useEffect } from 'react';
import { db, collection, getDocs } from '../firebase/firebase';
import HomePage from '../components/HomePage';

const Home = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        // 從Firebase獲取大學列表
        const querySnapshot = await getDocs(collection(db, "universities"));
        const universityList = [];
        
        querySnapshot.forEach((doc) => {
          universityList.push({ 
            id: doc.id, 
            ...doc.data() 
          });
        });
        
        setUniversities(universityList);
      } catch (error) {
        console.error("Error fetching universities:", error);
        setError("無法載入大學列表，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  if (loading) {
    return <div className="loading-container">載入中...</div>;
  }

  if (error) {
    return <div className="error-container" role="alert">{error}</div>;
  }

  return <HomePage universities={universities} />;
};

export default Home;