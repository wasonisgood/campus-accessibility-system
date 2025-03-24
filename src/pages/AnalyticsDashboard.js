import React, { useState, useEffect, useCallback } from 'react';
import SeverityDistributionChart from '../components/SeverityDistributionChart';
import CategoryDistributionChart from '../components/CategoryDistributionChart';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import UniversityRanking from '../components/UniversityRanking';
import { db, collection, getDocs, query, where, doc, getDoc, 
  Timestamp, orderBy, limit } from '../firebase/firebase';
import './AnalyticsDashboard.css';

// Initial states
const initialState = {
  universities: [],
  buildings: [],
  issues: [],
  availableBuildings: [],
  selectedUniversity: 'all',
  selectedBuilding: 'all',
  selectedCategory: 'all',
  timeRange: 'month',
  isLoading: true,
  error: null
};

const AnalyticsDashboard = () => {
  // State management using initialState
  const [state, setState] = useState(initialState);
  
  // Destructure state for easier access
  const {
    universities,
    buildings,
    issues,
    availableBuildings,
    selectedUniversity,
    selectedBuilding,
    selectedCategory,
    timeRange,
    isLoading,
    error
  } = state;

  // Update state helpers
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Define state setters using useCallback
  const setIsLoading = useCallback((loading) => 
    updateState({ isLoading: loading }), [updateState]);
  
  const setError = useCallback((err) => 
    updateState({ error: err }), [updateState]);
  
  const setUniversities = useCallback((unis) => 
    updateState({ universities: unis }), [updateState]);
  
  const setBuildings = useCallback((builds) => 
    updateState({ buildings: builds }), [updateState]);
  
  const setIssues = useCallback((issuesList) => 
    updateState({ issues: issuesList }), [updateState]);
  
  const setAvailableBuildings = useCallback((availBuilds) => 
    updateState({ availableBuildings: availBuilds }), [updateState]);
  
  const setSelectedUniversity = useCallback((uni) => 
    updateState({ selectedUniversity: uni }), [updateState]);
  
  const setSelectedBuilding = useCallback((build) => 
    updateState({ selectedBuilding: build }), [updateState]);
  
  const setSelectedCategory = useCallback((cat) => 
    updateState({ selectedCategory: cat }), [updateState]);
  
  const setTimeRange = useCallback((range) => 
    updateState({ timeRange: range }), [updateState]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
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
            {Object.entries(getCategoryName).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
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
        <div className="stat-card">
          <div className="stat-card-header">
            <h2 className="stat-card-title">總問題數量</h2>
            <div className="stat-card-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{getFilteredIssues().length}</div>
          <div className="stat-card-subtitle">
            {selectedUniversity === 'all' ? '所有大學' : 
              universities.find(uni => uni.id === selectedUniversity)?.name}
            {selectedBuilding !== 'all' && 
              ` > ${availableBuildings.find(b => b.id === selectedBuilding)?.name}`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h2 className="stat-card-title">已解決問題</h2>
            <div className="stat-card-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">
            {getFilteredIssues().filter(issue => issue.resolved).length}
          </div>
          <div className="stat-card-subtitle">
            佔總問題數的 {Math.round((getFilteredIssues().filter(issue => issue.resolved).length / 
              getFilteredIssues().length) * 100)}%
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <h2 className="stat-card-title">最嚴重問題類型</h2>
            <div className="stat-card-icon red">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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


      setError(null);
      
      try {
        // Fetch Universities
        const universitiesQuery = query(collection(db, 'universities'));
        const universitiesSnapshot = await getDocs(universitiesQuery);
        
        const universitiesData = [];
        universitiesSnapshot.forEach(doc => {
          universitiesData.push({
            id: doc.id,
            ...doc.data(),
            buildings: []
          });
        });
        
        setUniversities(universitiesData);
        
        // Fetch Buildings
        const buildingsQuery = query(collection(db, 'buildings'));
        const buildingsSnapshot = await getDocs(buildingsQuery);
        
        const buildingsData = [];
        buildingsSnapshot.forEach(doc => {
          buildingsData.push({
            id: doc.id,
            ...doc.data(),
            issues: []
          });
        });
        
        // Assign Buildings to Universities
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
        
        // Fetch Bathrooms and Extract Issues
        const bathroomsQuery = query(collection(db, 'bathrooms'));
        const bathroomsSnapshot = await getDocs(bathroomsQuery);
        
        const allIssues = [];
        
        bathroomsSnapshot.forEach(doc => {
          const bathroomData = doc.data();
          const buildingId = bathroomData.buildingId;
          
          const buildingIndex = buildingsData.findIndex(b => b.id === buildingId);
          
          if (buildingIndex !== -1 && bathroomData.floors) {
            bathroomData.floors.forEach((floor, floorIndex) => {
              if (floor.hasAccessible && floor.features) {
                extractIssues(floor, floorIndex, buildingId, doc.id, allIssues);
              }
            });
          }
        });
        
        setIssues(allIssues);
        
        // Update Universities and Buildings with Issues
        const updatedUniversities = [...universitiesWithBuildings];
        buildingsData.forEach((building, buildingIndex) => {
          const buildingIssues = allIssues.filter(issue => issue.buildingId === building.id);
          buildingsData[buildingIndex].issues = buildingIssues;
          
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
        console.error('Error fetching data:', err);
        setError('Error fetching data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle University Selection
  useEffect(() => {
    if (selectedUniversity === 'all') {
      setAvailableBuildings([]);
      return;
    }

    const uniBuildings = universities.find(uni => uni.id === selectedUniversity)?.buildings || [];
    setAvailableBuildings(uniBuildings);
    setSelectedBuilding('all');
  }, [selectedUniversity, universities]);

  // Helper Functions
  const extractIssues = (floor, floorIndex, buildingId, bathroomId, issuesArray) => {
    const features = floor.features;
    const now = new Date();
    const reportedTime = floor.updatedAt ? new Date(floor.updatedAt) : now;
    const photos = floor.photos || {};
    
    const issueChecks = [
      { check: !features.doorWidth?.adequate, category: 'doorWidth', severity: 'major', photo: photos.doorWidth },
      { check: !features.innerSpace?.adequate, category: 'innerSpace', severity: 'major', photo: photos.innerSpace },
      { check: features.rotationSpace?.insufficient, category: 'rotationSpace', severity: 'major', photo: photos.rotationSpace },
      { check: !features.doorLock?.functional, category: 'doorLock', severity: 'major', photo: photos.doorLock },
      { check: !features.toilet?.properHeight, category: 'toilet', severity: 'moderate', photo: photos.toilet },
      { check: !features.handrails?.exists, category: 'handrails', severity: 'major', photo: photos.handrails },
      { check: !features.sink?.exists || !features.sink?.accessible, category: 'sink', severity: 'moderate', photo: photos.sink },
      { check: features.toiletPaper?.improperPlacement, category: 'toiletPaper', severity: 'minor', photo: photos.toiletPaper },
      { check: !features.emergencyCall?.exists, category: 'emergencyCall', severity: 'moderate', photo: photos.emergencyCall },
      { check: !features.floor?.nonSlip, category: 'floor', severity: 'minor', photo: null },
      { check: !features.threshold?.none && !features.threshold?.hasRamp, category: 'threshold', severity: 'moderate', photo: null },
      { check: !features.pathway?.adequate, category: 'pathway', severity: 'major', photo: null },
      { check: !features.signage?.clear, category: 'signage', severity: 'minor', photo: null },
      { check: !features.lighting?.adequate, category: 'lighting', severity: 'minor', photo: null },
      { check: features.issues?.usedAsStorage, category: 'usedAsStorage', severity: 'critical', photo: photos.usedAsStorage },
      { check: features.issues?.needsRenovation, category: 'needsRenovation', severity: 'critical', photo: photos.needsRenovation },
      { check: features.issues?.otherIssues, category: 'otherIssues', severity: 'critical', photo: photos.otherIssues }
    ];

    issueChecks.forEach(({ check, category, severity, photo }) => {
      if (check) {
        issuesArray.push(createIssue(category, severity, buildingId, bathroomId, floorIndex, reportedTime, photo));
      }
    });
  };

  const createIssue = (category, severity, buildingId, bathroomId, floor, reportedAt, photoUrl = null) => ({
    id: `${buildingId}-${bathroomId}-${floor}-${category}`,
    category,
    severity,
    buildingId,
    bathroomId,
    floor,
    reportedAt,
    photoUrl,
    resolved: false
  });

  const getFilteredIssues = () => {
    if (!issues.length) return [];
    
    let filteredIssues = [...issues];
    
    if (selectedUniversity !== 'all') {
      const uniBuildings = universities.find(uni => uni.id === selectedUniversity)?.buildings || [];
      const buildingIds = uniBuildings.map(b => b.id);
      filteredIssues = filteredIssues.filter(issue => buildingIds.includes(issue.buildingId));
    }
    
    if (selectedBuilding !== 'all') {
      filteredIssues = filteredIssues.filter(issue => issue.buildingId === selectedBuilding);
    }
    
    if (selectedCategory !== 'all') {
      filteredIssues = filteredIssues.filter(issue => issue.category === selectedCategory);
    }
    
    const now = new Date();
    const timeRanges = {
      month: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      quarter: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      halfYear: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      year: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    };
    
    const timeLimit = timeRanges[timeRange];
    if (timeLimit) {
      filteredIssues = filteredIssues.filter(issue => new Date(issue.reportedAt) >= timeLimit);
    }
    
    return filteredIssues;
  };

  // Data Processing Functions
  const getSeverityStats = () => {
    const filteredIssues = getFilteredIssues();
    
    const stats = [
      { name: '嚴重', value: 0, color: '#EF4444' },
      { name: '主要', value: 0, color: '#F97316' },
      { name: '中度', value: 0, color: '#F59E0B' },
      { name: '輕微', value: 0, color: '#84CC16' }
    ];
    
    const severityMap = {
      critical: 0,
      major: 1,
      moderate: 2,
      minor: 3
    };
    
    filteredIssues.forEach(issue => {
      const index = severityMap[issue.severity];
      if (index !== undefined) {
        stats[index].value++;
      }
    });
    
    return stats;
  };

  const getCategoryStats = () => {
    const filteredIssues = getFilteredIssues();
    const categories = {};
    
    filteredIssues.forEach(issue => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });
    
    return Object.entries(categories).map(([key, value]) => ({
      name: getCategoryName(key),
      value,
      id: key
    }));
  };

  const getMonthlyTrend = () => {
    const filteredIssues = getFilteredIssues();
    
    const months = {
      '01': '一月', '02': '二月', '03': '三月', '04': '四月',
      '05': '五月', '06': '六月', '07': '七月', '08': '八月',
      '09': '九月', '10': '十月', '11': '十一月', '12': '十二月'
    };
    
    const monthlyStats = Object.keys(months).reduce((acc, month) => ({
      ...acc,
      [month]: {
        name: months[month],
        critical: 0,
        major: 0,
        moderate: 0,
        minor: 0,
        total: 0
      }
    }), {});
    
    filteredIssues.forEach(issue => {
      const date = new Date(issue.reportedAt);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      monthlyStats[month][issue.severity]++;
      monthlyStats[month].total++;
    });
    
    return Object.values(monthlyStats);
  };

  const getUniversityRanking = () => {
    if (!universities.length) return [];
    
    const ranking = universities.map(uni => ({
      id: uni.id,
      name: uni.name,
      totalIssues: uni.buildings.reduce((sum, building) => sum + building.issues.length, 0)
    }));
    
    return ranking.sort((a, b) => b.totalIssues - a.totalIssues).slice(0, 5);
  };

  const getCategoryName = (categoryId) => {
    const categoryNames = {
      doorWidth: '門寬不足',
      innerSpace: '內部空間不足',
      rotationSpace: '旋轉空間不足',
      doorLock: '門鎖問題',
      toilet: '馬桶高度不適宜',
      handrails: '缺少扶手',
      sink: '洗手台問題',
      toiletPaper: '衛生紙擺放不當',
      emergencyCall: '無緊急求助鈴',
      floor: '地板問題',
      threshold: '門檻高低差',
      pathway: '通道寬度不足',
      signage: '標示不明顯',
      lighting: '照明不足',
      usedAsStorage: '被用作儲藏室',
      needsRenovation: '需要整修',
      otherIssues: '其他問題'
    };
    
    return categoryNames[categoryId] || categoryId;
  };

  // Event Handlers
  const handleUniversityChange = (e) => setSelectedUniversity(e.target.value);
  const handleBuildingChange = (e) => setSelectedBuilding(e.target.value);
  const handleCategoryChange = (e) => setSelectedCategory(e.target.value);
  const handleTimeRangeChange = (e) => setTimeRange(e.target.value);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <div className="error-message-title">發生錯誤</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>校園無障礙設施分析儀表板</h1>
        <p>全面了解各大學無障礙廁所設施問題的統計和趨勢</p>
      </div>
            {/* 圖表區 */}
            <div className="charts-row two-columns">
        <SeverityDistributionChart data={getSeverityStats()} />
        <CategoryDistributionChart data={getCategoryStats()} />
      </div>
      
      <div className="charts-row">
        <MonthlyTrendChart data={getMonthlyTrend()} />
      </div>
      
      <div className="charts-row two-columns">
        <UniversityRanking data={getUniversityRanking()} />
        
        {/* 建築物排名 */}
        <div className="ranking-card">
          <h2 className="ranking-title">問題最多的建築物</h2>
          <div className="ranking-list">
            {buildings
              .sort((a, b) => b.issues.length - a.issues.length)
              .slice(0, 5)
              .map((building, index) => (
                <div key={building.id} className="ranking-item">
                  <div className="ranking-position purple">
                    <span className="ranking-position-text purple">{index + 1}</span>
                  </div>
                  <div className="ranking-info">
                    <div className="ranking-name">{building.name}</div>
                    <div className="ranking-details">
                      {universities.find(uni => 
                        uni.buildings.some(b => b.id === building.id)
                      )?.name || '未知大學'}
                    </div>
                    <div className="ranking-details">{building.issues.length} 個問題</div>
                  </div>
                  <div className="ranking-progress">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill purple"
                        style={{ 
                          width: `${(building.issues.length / 
                            buildings.sort((a, b) => b.issues.length - a.issues.length)[0].issues.length) 
                            * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;