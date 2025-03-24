// src/pages/AnalyticsDashboard.js

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector, 
  ComposedChart, Area
} from 'recharts';
import { 
  db, collection, getDocs, query, where, doc, getDoc, 
  Timestamp, orderBy, limit
} from '../firebase/firebase';
import './AnalyticsDashboard.css';

// 校園廁所無障礙問題可視化儀表板
const AnalyticsDashboard = () => {
  // 狀態管理
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 數據狀態
  const [universities, setUniversities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [issues, setIssues] = useState([]);
  const [availableBuildings, setAvailableBuildings] = useState([]);

  // 獲取數據
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 獲取大學列表
        const universitiesQuery = query(collection(db, 'universities'));
        const universitiesSnapshot = await getDocs(universitiesQuery);
        
        const universitiesData = [];
        universitiesSnapshot.forEach(doc => {
          universitiesData.push({
            id: doc.id,
            ...doc.data(),
            buildings: [] // 初始化建築物列表
          });
        });
        
        setUniversities(universitiesData);
        
        // 獲取所有建築物
        const buildingsQuery = query(collection(db, 'buildings'));
        const buildingsSnapshot = await getDocs(buildingsQuery);
        
        const buildingsData = [];
        buildingsSnapshot.forEach(doc => {
          buildingsData.push({
            id: doc.id,
            ...doc.data(),
            issues: [] // 初始化問題列表
          });
        });
        
        // 將建築物分配給大學
        const universitiesWithBuildings = [...universitiesData];
        buildingsData.forEach(building => {
          const universityIndex = universitiesWithBuildings.findIndex(
            uni => uni.id === building.universityId
          );
          
          if (universityIndex !== -1) {
            universitiesWithBuildings[universityIndex].buildings.push(building);
          }
        });
        
        setBuildings(buildingsData);
        
        // 獲取所有廁所數據，解析問題
        const bathroomsQuery = query(collection(db, 'bathrooms'));
        const bathroomsSnapshot = await getDocs(bathroomsQuery);
        
        const allIssues = [];
        
        bathroomsSnapshot.forEach(doc => {
          const bathroomData = doc.data();
          const buildingId = bathroomData.buildingId;
          
          // 找到對應建築物
          const buildingIndex = buildingsData.findIndex(b => b.id === buildingId);
          
          if (buildingIndex !== -1) {
            // 處理各樓層的數據
            if (bathroomData.floors && Array.isArray(bathroomData.floors)) {
              bathroomData.floors.forEach((floor, floorIndex) => {
                if (floor.hasAccessible && floor.features) {
                  // 檢查並提取各種問題
                  extractIssues(floor, floorIndex, buildingId, doc.id, allIssues);
                }
              });
            }
          }
        });
        
        setIssues(allIssues);
        
        // 按大學組織問題數據
        const updatedUniversities = [...universitiesWithBuildings];
        
        // 將問題分配給建築物
        buildingsData.forEach((building, buildingIndex) => {
          const buildingIssues = allIssues.filter(issue => issue.buildingId === building.id);
          buildingsData[buildingIndex].issues = buildingIssues;
          
          // 同時更新大學中的建築物
          updatedUniversities.forEach((uni, uniIndex) => {
            const buildingIdx = uni.buildings.findIndex(b => b.id === building.id);
            if (buildingIdx !== -1) {
              updatedUniversities[uniIndex].buildings[buildingIdx].issues = buildingIssues;
            }
          });
        });
        
        setUniversities(updatedUniversities);
        setBuildings(buildingsData);
      } catch (err) {
        console.error('獲取數據時出錯:', err);
        setError('獲取數據時出錯，請稍後再試。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 當選擇大學時獲取該大學的建築物
  useEffect(() => {
    if (selectedUniversity === 'all') {
      setAvailableBuildings([]);
      return;
    }

    const uniBuildings = universities.find(uni => uni.id === selectedUniversity)?.buildings || [];
    setAvailableBuildings(uniBuildings);
    
    // 重置建築物選擇
    setSelectedBuilding('all');
  }, [selectedUniversity, universities]);

  // 從廁所數據中提取問題
  const extractIssues = (floor, floorIndex, buildingId, bathroomId, issuesArray) => {
    const features = floor.features;
    const now = new Date();
    const reportedTime = floor.updatedAt ? new Date(floor.updatedAt) : now;
    const photos = floor.photos || {};
    
    // 檢查各種問題
    if (!features.doorWidth?.adequate) {
      issuesArray.push(createIssue('doorWidth', 'major', buildingId, bathroomId, floorIndex, reportedTime, photos.doorWidth));
    }
    
    if (!features.innerSpace?.adequate) {
      issuesArray.push(createIssue('innerSpace', 'major', buildingId, bathroomId, floorIndex, reportedTime, photos.innerSpace));
    }
    
    if (features.rotationSpace?.insufficient) {
      issuesArray.push(createIssue('rotationSpace', 'major', buildingId, bathroomId, floorIndex, reportedTime, photos.rotationSpace));
    }
    
    if (!features.doorLock?.functional) {
      issuesArray.push(createIssue('doorLock', 'major', buildingId, bathroomId, floorIndex, reportedTime, photos.doorLock));
    }
    
    if (!features.toilet?.properHeight) {
      issuesArray.push(createIssue('toilet', 'moderate', buildingId, bathroomId, floorIndex, reportedTime, photos.toilet));
    }
    
    if (!features.handrails?.exists) {
      issuesArray.push(createIssue('handrails', 'major', buildingId, bathroomId, floorIndex, reportedTime, photos.handrails));
    }
    
    if (!features.sink?.exists || !features.sink?.accessible) {
      issuesArray.push(createIssue('sink', 'moderate', buildingId, bathroomId, floorIndex, reportedTime, photos.sink));
    }
    
    if (features.toiletPaper?.improperPlacement) {
      issuesArray.push(createIssue('toiletPaper', 'minor', buildingId, bathroomId, floorIndex, reportedTime, photos.toiletPaper));
    }
    
    if (!features.emergencyCall?.exists) {
      issuesArray.push(createIssue('emergencyCall', 'moderate', buildingId, bathroomId, floorIndex, reportedTime, photos.emergencyCall));
    }
    
    if (!features.floor?.nonSlip) {
      issuesArray.push(createIssue('floor', 'minor', buildingId, bathroomId, floorIndex, reportedTime));
    }
    
    if (!features.threshold?.none && !features.threshold?.hasRamp) {
      issuesArray.push(createIssue('threshold', 'moderate', buildingId, bathroomId, floorIndex, reportedTime));
    }
    
    if (!features.pathway?.adequate) {
      issuesArray.push(createIssue('pathway', 'major', buildingId, bathroomId, floorIndex, reportedTime));
    }
    
    if (!features.signage?.clear) {
      issuesArray.push(createIssue('signage', 'minor', buildingId, bathroomId, floorIndex, reportedTime));
    }
    
    if (!features.lighting?.adequate) {
      issuesArray.push(createIssue('lighting', 'minor', buildingId, bathroomId, floorIndex, reportedTime));
    }
    
    // 嚴重問題
    if (features.issues?.usedAsStorage) {
      issuesArray.push(createIssue('usedAsStorage', 'critical', buildingId, bathroomId, floorIndex, reportedTime, photos.usedAsStorage));
    }
    
    if (features.issues?.needsRenovation) {
      issuesArray.push(createIssue('needsRenovation', 'critical', buildingId, bathroomId, floorIndex, reportedTime, photos.needsRenovation));
    }
    
    if (features.issues?.otherIssues) {
      issuesArray.push(createIssue('otherIssues', 'critical', buildingId, bathroomId, floorIndex, reportedTime, photos.otherIssues));
    }
  };

  // 創建問題對象
  const createIssue = (category, severity, buildingId, bathroomId, floor, reportedAt, photoUrl = null) => {
    return {
      id: `${buildingId}-${bathroomId}-${floor}-${category}`,
      category,
      severity,
      buildingId,
      bathroomId,
      floor,
      reportedAt,
      photoUrl,
      resolved: false // 默認未解決
    };
  };

  // 獲取篩選後的問題數據
  const getFilteredIssues = () => {
    if (!issues.length) return [];
    
    let filteredIssues = [...issues];
    
    // 篩選大學
    if (selectedUniversity !== 'all') {
      const uniBuildings = universities.find(uni => uni.id === selectedUniversity)?.buildings || [];
      const buildingIds = uniBuildings.map(b => b.id);
      filteredIssues = filteredIssues.filter(issue => buildingIds.includes(issue.buildingId));
    }
    
    // 篩選建築物
    if (selectedBuilding !== 'all') {
      filteredIssues = filteredIssues.filter(issue => issue.buildingId === selectedBuilding);
    }
    
    // 篩選問題類別
    if (selectedCategory !== 'all') {
      filteredIssues = filteredIssues.filter(issue => issue.category === selectedCategory);
    }
    
    // 篩選時間範圍
    const now = new Date();
    let timeLimit;
    
    switch(timeRange) {
      case 'month':
        timeLimit = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        timeLimit = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'halfYear':
        timeLimit = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'year':
        timeLimit = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        // 'all' - 不設時間限制
        timeLimit = null;
    }
    
    if (timeLimit) {
      filteredIssues = filteredIssues.filter(issue => new Date(issue.reportedAt) >= timeLimit);
    }
    
    return filteredIssues;
  };

  // 處理大學選擇
  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
  };

  // 處理建築物選擇
  const handleBuildingChange = (e) => {
    setSelectedBuilding(e.target.value);
  };

  // 處理問題類別選擇
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // 處理時間範圍選擇
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // 獲取問題嚴重性統計
  const getSeverityStats = () => {
    const filteredIssues = getFilteredIssues();
    
    const stats = [
      { name: '嚴重', value: 0, color: '#EF4444' },
      { name: '主要', value: 0, color: '#F97316' },
      { name: '中度', value: 0, color: '#F59E0B' },
      { name: '輕微', value: 0, color: '#84CC16' }
    ];
    
    filteredIssues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          stats[0].value++;
          break;
        case 'major':
          stats[1].value++;
          break;
        case 'moderate':
          stats[2].value++;
          break;
        case 'minor':
          stats[3].value++;
          break;
        default:
          break;
      }
    });
    
    return stats;
  };

  // 獲取問題類別統計
  const getCategoryStats = () => {
    const filteredIssues = getFilteredIssues();
    
    const categories = {};
    
    filteredIssues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = 0;
      }
      categories[issue.category]++;
    });
    
    return Object.keys(categories).map(key => ({
      name: getCategoryName(key),
      value: categories[key],
      id: key
    }));
  };

  // 獲取每月問題趨勢
  const getMonthlyTrend = () => {
    const filteredIssues = getFilteredIssues();
    
    // 月份映射
    const months = {
      '01': '一月', '02': '二月', '03': '三月', '04': '四月',
      '05': '五月', '06': '六月', '07': '七月', '08': '八月',
      '09': '九月', '10': '十月', '11': '十一月', '12': '十二月'
    };
    
    // 初始化每月統計
    const monthlyStats = {};
    Object.keys(months).forEach(month => {
      monthlyStats[month] = {
        name: months[month],
        critical: 0,
        major: 0,
        moderate: 0,
        minor: 0,
        total: 0
      };
    });
    
    // 統計每月問題數量
    filteredIssues.forEach(issue => {
      const date = new Date(issue.reportedAt);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      monthlyStats[month][issue.severity]++;
      monthlyStats[month].total++;
    });
    
    // 轉換為數組並排序
    return Object.values(monthlyStats).sort((a, b) => {
      const monthOrder = Object.values(months);
      return monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name);
    });
  };

  // 獲取問題最多的大學排名
  const getUniversityRanking = () => {
    if (!universities.length) return [];
    
    const ranking = universities.map(uni => {
      let totalIssues = 0;
      
      uni.buildings.forEach(building => {
        totalIssues += building.issues.length;
      });
      
      return {
        id: uni.id,
        name: uni.name,
        totalIssues
      };
    });
    
    return ranking.sort((a, b) => b.totalIssues - a.totalIssues).slice(0, 5);
  };

  // 獲取問題最多的建築物排名
  const getBuildingRanking = () => {
    if (!buildings.length || !universities.length) return [];
    
    const buildingsList = buildings.map(building => {
      const university = universities.find(uni => 
        uni.buildings.some(b => b.id === building.id)
      );
      
      return {
        id: building.id,
        name: building.name,
        universityName: university?.name || '未知大學',
        totalIssues: building.issues.length
      };
    });
    
    return buildingsList.sort((a, b) => b.totalIssues - a.totalIssues).slice(0, 5);
  };

  // 獲取總問題數量和問題解決率
  const getIssueMetrics = () => {
    const filteredIssues = getFilteredIssues();
    const totalIssues = filteredIssues.length;
    const resolvedIssues = filteredIssues.filter(issue => issue.resolved).length;
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
    
    return { totalIssues, resolvedIssues, resolutionRate };
  };

  // 獲取類別名稱
  const getCategoryName = (categoryId) => {
    const categoryNames = {
      'doorWidth': '門寬不足',
      'innerSpace': '內部空間不足',
      'rotationSpace': '旋轉空間不足',
      'doorLock': '門鎖問題',
      'toilet': '馬桶高度不適宜',
      'handrails': '缺少扶手',
      'sink': '洗手台問題',
      'toiletPaper': '衛生紙擺放不當',
      'emergencyCall': '無緊急求助鈴',
      'floor': '地板問題',
      'threshold': '門檻高低差',
      'pathway': '通道寬度不足',
      'signage': '標示不明顯',
      'lighting': '照明不足',
      'usedAsStorage': '被用作儲藏室',
      'needsRenovation': '需要整修',
      'otherIssues': '其他問題'
    };
    
    return categoryNames[categoryId] || categoryId;
  };

  // 渲染自定義圓餅圖標籤
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#1F2937" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // 加載中顯示
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // 錯誤顯示
  if (error) {
    return (
      <div className="error-message">
        <div className="error-message-title">發生錯誤</div>
        <p>{error}</p>
      </div>
    );
  }

  // 渲染儀表板
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>校園無障礙設施分析儀表板</h1>
        <p>全面了解各大學無障礙廁所設施問題的統計和趨勢</p>
      </div>
      
      {/* 篩選區 */}
      <div className="filter-section">
        <div className="filter-group">
          <label className="filter-label">選擇大學</label>
          <select 
            className="filter-select"
            value={selectedUniversity}
            onChange={handleUniversityChange}
          >
            <option value="all">所有大學</option>
            {universities.map(uni => (
              <option key={uni.id} value={uni.id}>{uni.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">選擇建築物</label>
          <select 
            className="filter-select"
            value={selectedBuilding}
            onChange={handleBuildingChange}
            disabled={selectedUniversity === 'all'}
          >
            <option value="all">所有建築物</option>
            {availableBuildings.map(building => (
              <option key={building.id} value={building.id}>{building.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">問題類別</label>
          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="all">所有類別</option>
            <option value="doorWidth">門寬不足</option>
            <option value="innerSpace">內部空間不足</option>
            <option value="rotationSpace">旋轉空間不足</option>
            <option value="doorLock">門鎖問題</option>
            <option value="toilet">馬桶高度不適宜</option>
            <option value="handrails">缺少扶手</option>
            <option value="sink">洗手台問題</option>
            <option value="toiletPaper">衛生紙擺放不當</option>
            <option value="emergencyCall">無緊急求助鈴</option>
            <option value="usedAsStorage">被用作儲藏室</option>
            <option value="needsRenovation">需要整修</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">時間範圍</label>
          <select 
            className="filter-select"
            value={timeRange}
            onChange={handleTimeRangeChange}
          >
            <option value="month">過去一個月</option>
            <option value="quarter">過去三個月</option>
            <option value="halfYear">過去半年</option>
            <option value="year">過去一年</option>
            <option value="all">全部時間</option>
          </select>
        </div>
      </div>
      
      {/* 統計卡片區 */}
      <div className="stats-cards">
        {/* 總問題數量 */}
        <div className="stat-card">
          <div className="stat-card-header">
            <h2 className="stat-card-title">總問題數量</h2>
            <div className="stat-card-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{getIssueMetrics().totalIssues}</div>
          <div className="stat-card-subtitle">
            {selectedUniversity === 'all' ? '所有大學' : universities.find(uni => uni.id === selectedUniversity)?.name}
            {selectedBuilding !== 'all' && ` > ${availableBuildings.find(b => b.id === selectedBuilding)?.name}`}
          </div>
        </div>
        
        {/* 已解決問題 */}
        <div className="stat-card">
          <div className="stat-card-header">
            <h2 className="stat-card-title">已解決問題</h2>
            <div className="stat-card-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{getIssueMetrics().resolvedIssues}</div>
          <div className="stat-card-subtitle">
            佔總問題數的 {getIssueMetrics().resolutionRate}%
          </div>
        </div>
        
        {/* 最嚴重問題 */}
        <div className="stat-card">
          <div className="stat-card-header">
            <h2 className="stat-card-title">最嚴重問題類型</h2>
            <div className="stat-card-icon red">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">
            {getCategoryStats().sort((a, b) => b.value - a.value)[0]?.name || '無數據'}
          </div>
          <div className="stat-card-subtitle">
            共有 {getCategoryStats().sort((a, b) => b.value - a.value)[0]?.value || 0} 個問題
          </div>
        </div>
      </div>
      
      {/* 圖表區 - 第一行 */}
      <div className="charts-row two-columns">
        {/* 問題嚴重性分布圖 */}
        <div className="chart-card">
          <h2 className="chart-title">問題嚴重性分布</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getSeverityStats().filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getSeverityStats().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} 個問題`, '數量']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 問題類別分布圖 */}
        <div className="chart-card">
          <h2 className="chart-title">問題類別分布</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getCategoryStats().sort((a, b) => b.value - a.value).slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [`${value} 個問題`, '數量']} />
                <Bar dataKey="value" fill="#6366F1" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* 圖表區 - 第二行 */}
      <div className="charts-row">
        {/* 問題趨勢圖 */}
        <div className="chart-card">
          <h2 className="chart-title">月度問題趨勢</h2>
          <div className="chart-container large">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={getMonthlyTrend()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical" name="嚴重" stackId="a" fill="#EF4444" />
                <Bar dataKey="major" name="主要" stackId="a" fill="#F97316" />
                <Bar dataKey="moderate" name="中度" stackId="a" fill="#F59E0B" />
                <Bar dataKey="minor" name="輕微" stackId="a" fill="#84CC16" />
                <Line type="monotone" dataKey="total" name="總計" stroke="#3B82F6" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* 排名區 */}
      <div className="charts-row two-columns">
        {/* 問題最多的大學 */}
        <div className="ranking-card">
          <h2 className="ranking-title">問題最多的大學</h2>
          <div className="ranking-list">
            {getUniversityRanking().map((uni, index) => (
              <div key={uni.id} className="ranking-item">
                <div className="ranking-position blue">
                  <span className="ranking-position-text blue">{index + 1}</span>
                </div>
                <div className="ranking-info">
                  <div className="ranking-name">{uni.name}</div>
                  <div className="ranking-details">{uni.totalIssues} 個問題</div>
                </div>
                <div className="ranking-progress">
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill blue"
                      style={{ 
                        width: `${getUniversityRanking()[0]?.totalIssues ? 
                          (uni.totalIssues / getUniversityRanking()[0].totalIssues) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {getUniversityRanking().length === 0 && (
              <div className="no-data">無數據</div>
            )}
          </div>
        </div>
        
        {/* 問題最多的建築物 */}
        <div className="ranking-card">
          <h2 className="ranking-title">問題最多的建築物</h2>
          <div className="ranking-list">
            {getBuildingRanking().map((building, index) => (
              <div key={building.id} className="ranking-item">
                <div className="ranking-position purple">
                  <span className="ranking-position-text purple">{index + 1}</span>
                </div>
                <div className="ranking-info">
                  <div className="ranking-name">{building.name}</div>
                  <div className="ranking-details">{building.universityName}</div>
                  <div className="ranking-details">{building.totalIssues} 個問題</div>
                </div>
                <div className="ranking-progress">
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill purple"
                      style={{ 
                        width: `${getBuildingRanking()[0]?.totalIssues ? 
                          (building.totalIssues / getBuildingRanking()[0].totalIssues) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {getBuildingRanking().length === 0 && (
              <div className="no-data">無數據</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;