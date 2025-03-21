// initializeNTHUBuildings.js

// 改用 CommonJS 語法
const { db, collection, addDoc, doc, setDoc, getDocs, query, where, deleteDoc } = require('../src/firebase/common.js');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
// Building coordinates data from the provided JSON
const buildingsCoordinates = {
  "第四綜合大樓": {
    "lat": 24.7957,
    "lng": 120.99652
  },
  "創新育成中心(舊)": {
    "lat": 24.79534,
    "lng": 120.99649
  },
  "動機化學實驗館": {
    "lat": 24.796533,
    "lng": 120.995204
  },
  "化學館": {
    "lat": 24.7962,
    "lng": 120.99599
  },
  "工程一館": {
    "lat": 24.79519,
    "lng": 120.99604
  },
  "化工館": {
    "lat": 24.79629,
    "lng": 120.99507
  },
  "學習資源中心(旺宏館)": {
    "lat": 24.79538,
    "lng": 120.99457
  },
  "醫輔大樓": {
    "lat": 24.79625,
    "lng": 120.99431
  },
  "工程三館": {
    "lat": 24.79634,
    "lng": 120.99256
  },
  "材料科技館": {
    "lat": 24.79641,
    "lng": 120.99171
  },
  "台達館": {
    "lat": 24.79591,
    "lng": 120.99211
  },
  "教育館": {
    "lat": 24.795557,
    "lng": 120.993703
  },
  "物理館": {
    "lat": 24.79434,
    "lng": 120.9924
  },
  "資訊電機館": {
    "lat": 24.79508,
    "lng": 120.99213
  },
  "第三綜合大樓": {
    "lat": 24.79507,
    "lng": 120.99358
  },
  "第一綜合大樓(行政大樓、合勤演藝廳)": {
    "lat": 24.79466,
    "lng": 120.994548
  },
  "第二綜合大樓(藝術中心、計算機與通訊中心)": {
    "lat": 24.79438,
    "lng": 120.99325
  },
  "蘇格貓底咖啡屋": {
    "lat": 24.793916,
    "lng": 120.993137
  },
  "清華名人堂": {
    "lat": 24.793896,
    "lng": 120.992822
  },
  "小吃部": {
    "lat": 24.79322,
    "lng": 120.99294
  },
  "水木生活中心": {
    "lat": 24.7925,
    "lng": 120.99394
  },
  "風雲樓": {
    "lat": 24.792235,
    "lng": 120.994594
  },
  "大禮堂": {
    "lat": 24.79357,
    "lng": 120.99388
  },
  "游泳池": {
    "lat": 24.79507,
    "lng": 120.99128
  },
  "舊體育館(桌球館)": {
    "lat": 24.79434,
    "lng": 120.99131
  },
  "體育館": {
    "lat": 24.79361,
    "lng": 120.99148
  },
  "蒙民偉樓(學生活動中心)": {
    "lat": 24.7936,
    "lng": 120.99193
  },
  "校友體育館": {
    "lat": 24.795087,
    "lng": 120.989845
  },
  "明齋": {
    "lat": 24.79277,
    "lng": 120.99315
  },
  "平齋": {
    "lat": 24.7926,
    "lng": 120.99319
  },
  "善齋": {
    "lat": 24.7922,
    "lng": 120.99345
  },
  "華齋": {
    "lat": 24.79179,
    "lng": 120.99402
  },
  "實齋": {
    "lat": 24.79161,
    "lng": 120.99509
  },
  "仁齋": {
    "lat": 24.79151,
    "lng": 120.9957
  },
  "碩齋": {
    "lat": 24.79136,
    "lng": 120.99677
  },
  "禮齋": {
    "lat": 24.79125,
    "lng": 120.99529
  },
  "信齋 A": {
    "lat": 24.79123,
    "lng": 120.99571
  },
  "儒齋": {
    "lat": 24.79065,
    "lng": 120.99447
  },
  "誠齋": {
    "lat": 24.79147,
    "lng": 120.99393
  },
  "義齋": {
    "lat": 24.79102,
    "lng": 120.99391
  },
  "鴻齋": {
    "lat": 24.79055,
    "lng": 120.99372
  },
  "學齋": {
    "lat": 24.79012,
    "lng": 120.99301
  },
  "清齋": {
    "lat": 24.79127,
    "lng": 120.99314
  },
  "新齋": {
    "lat": 24.79164,
    "lng": 120.9929
  },
  "雅齋": {
    "lat": 24.79287,
    "lng": 120.99185
  },
  "靜齋": {
    "lat": 24.79258,
    "lng": 120.99129
  },
  "慧齋": {
    "lat": 24.79217,
    "lng": 120.99125
  },
  "文齋": {
    "lat": 24.79201,
    "lng": 120.99078
  },
  "清華會館": {
    "lat": 24.797912,
    "lng": 120.990932
  },
  "第二招待所": {
    "lat": 24.796913,
    "lng": 120.991228
  },
  "駐警隊": {
    "lat": 24.79169,
    "lng": 120.99168
  },
  "工科館": {
    "lat": 24.79111,
    "lng": 120.99085
  },
  "李存敏館": {
    "lat": 24.790759,
    "lng": 120.99136
  },
  "原科中心": {
    "lat": 24.79079,
    "lng": 120.99133
  },
  "人文社會學館": {
    "lat": 24.78987,
    "lng": 120.9897
  },
  "生命科學一館": {
    "lat": 24.7899,
    "lng": 120.99026
  },
  "生命科學二館": {
    "lat": 24.78945,
    "lng": 120.9897
  },
  "生醫工程與環境科學館": {
    "lat": 24.78928,
    "lng": 120.9914
  },
  "原子爐": {
    "lat": 24.789785,
    "lng": 120.992187
  },
  "同位素館": {
    "lat": 24.78932,
    "lng": 120.99216
  },
  "生物科技館": {
    "lat": 24.78985,
    "lng": 120.99127
  },
  "光電研究中心-高能光電實驗室": {
    "lat": 24.78876,
    "lng": 120.99168
  },
  "加速器館": {
    "lat": 24.78877,
    "lng": 120.99207
  },
  "台積館": {
    "lat": 24.78699,
    "lng": 120.98795
  }
};

// 檢查大學是否已經存在，若不存在則創建
async function createUniversityIfNotExists() {
  try {
    // 先檢查是否已經有清華大學的記錄
    const universitiesQuery = query(
      collection(db, 'universities'),
      where('name', '==', '國立清華大學')
    );
    
    const universitiesSnapshot = await getDocs(universitiesQuery);
    
    // 如果已經存在，直接返回ID
    if (!universitiesSnapshot.empty) {
      const universityDoc = universitiesSnapshot.docs[0];
      console.log("清華大學記錄已存在，ID: " + universityDoc.id);
      return universityDoc.id;
    }
    
    // 若不存在，創建大學記錄
    const universityRef = doc(collection(db, 'universities'));
    await setDoc(universityRef, {
      name: '國立清華大學',
      shortName: '清大',
      location: '新竹市東區光復路二段101號',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("成功創建清華大學記錄！ID: " + universityRef.id);
    return universityRef.id;
  } catch (error) {
    console.error("創建大學記錄時發生錯誤:", error);
    throw error;
  }
}

// 根據建築物名稱推測建築物類型
function determineBuildingType(buildingName) {
  if (buildingName.includes('齋')) {
    return 'dormitory'; // 宿舍
  } else if (buildingName.includes('餐廳') || buildingName.includes('小吃部') || buildingName.includes('咖啡')) {
    return 'cafeteria'; // 餐廳
  } else if (buildingName.includes('體育館') || buildingName.includes('游泳池') || buildingName.includes('大禮堂')) {
    return 'venue'; // 大型場館
  } else if (buildingName.includes('館') && !buildingName.includes('會館')) {
    return 'academic'; // 教學大樓
  } else if (buildingName.includes('中心') || buildingName.includes('行政')) {
    return 'office'; // 辦公大樓
  } else if (buildingName.includes('圖書館') || buildingName.includes('學習資源')) {
    return 'library'; // 圖書館
  } else {
    return 'other'; // 其他
  }
}

// 為每個建築物創建文檔
async function createBuildings(universityId) {
  let successCount = 0;
  let totalCount = Object.keys(buildingsCoordinates).length;
  
  for (const [buildingName, coordinates] of Object.entries(buildingsCoordinates)) {
    try {
      // 檢查此建築物是否已存在
      const buildingsQuery = query(
        collection(db, 'buildings'),
        where('name', '==', buildingName),
        where('universityId', '==', universityId)
      );
      
      const buildingsSnapshot = await getDocs(buildingsQuery);
      
      // 如果已經存在，跳過
      if (!buildingsSnapshot.empty) {
        console.log(`建築物 "${buildingName}" 已存在，跳過創建`);
        continue;
      }
      
      // 建築物數據
      const buildingData = {
        name: buildingName,
        universityId: universityId,
        type: determineBuildingType(buildingName),
        floors: 4, // 根據需求設為4樓
        hasElevator: true, // 根據需求設為有電梯
        lat: coordinates.lat,
        lng: coordinates.lng,
        description: `${buildingName}位於清華大學校園內，共有4層樓，設有電梯方便行動不便人士使用。`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 創建建築物文檔
      const docRef = await addDoc(collection(db, "buildings"), buildingData);
      console.log(`成功創建建築物 "${buildingName}" 記錄，ID: ${docRef.id}`);
      successCount++;
      
      // 初始化樓層的無障礙廁所記錄
      await initializeBathroomForBuilding(docRef.id, buildingName);
    } catch (error) {
      console.error(`創建建築物 "${buildingName}" 記錄時發生錯誤:`, error);
    }
  }
  
  console.log(`建築物初始化完成：成功創建 ${successCount}/${totalCount} 個建築物記錄`);
}

// 為建築物初始化無障礙廁所記錄
async function initializeBathroomForBuilding(buildingId, buildingName) {
  try {
    // 檢查此建築物是否已有廁所記錄
    const bathroomsQuery = query(
      collection(db, 'bathrooms'),
      where('buildingId', '==', buildingId)
    );
    
    const bathroomsSnapshot = await getDocs(bathroomsQuery);
    
    // 如果已經存在，跳過
    if (!bathroomsSnapshot.empty) {
      console.log(`建築物 "${buildingName}" 已有廁所記錄，跳過創建`);
      return;
    }
    
    // 創建四個樓層的資料結構
    const floors = [
      {
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
          issues: { usedAsStorage: false, needsRenovation: false }
        }
      },
      {
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
          issues: { usedAsStorage: false, needsRenovation: false }
        }
      },
      {
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
          issues: { usedAsStorage: false, needsRenovation: false }
        }
      },
      {
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
          issues: { usedAsStorage: false, needsRenovation: false }
        }
      }
    ];
    
    // 廁所數據
    const bathroomData = {
      buildingId: buildingId,
      hasAccessibleBathroom: false, // 預設為無無障礙廁所
      floors: floors,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 創建廁所記錄
    const bathroomRef = await addDoc(collection(db, "bathrooms"), bathroomData);
    console.log(`成功創建建築物 "${buildingName}" 的廁所記錄，ID: ${bathroomRef.id}`);
    
  } catch (error) {
    console.error(`創建建築物 "${buildingName}" 的廁所記錄時發生錯誤:`, error);
  }
}

// 清空集合中的所有文檔
async function clearCollection(collectionName) {
  try {
    console.log(`開始清空 ${collectionName} 集合...`);
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.empty) {
      console.log(`${collectionName} 集合已經是空的`);
      return 0;
    }
    
    let count = 0;
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      count++;
      if (count % 10 === 0) {
        console.log(`已刪除 ${count}/${snapshot.size} 個 ${collectionName} 文檔`);
      }
    }
    
    console.log(`成功清空 ${collectionName} 集合，共刪除了 ${count} 個文檔`);
    return count;
  } catch (error) {
    console.error(`清空 ${collectionName} 集合時發生錯誤:`, error);
    throw error;
  }
}

// 清空所有相關集合
async function clearAllCollections() {
  // 先清空依賴於其他集合的文檔
  await clearCollection('bathrooms'); // 先清空廁所，因為它們依賴於建築物
  await clearCollection('buildings'); // 再清空建築物，因為它們依賴於大學
  await clearCollection('universities'); // 最後清空大學
}

// 請求用戶確認
async function confirmAction(message) {
  const rl = readline.createInterface({ input, output });
  
  try {
    const answer = await rl.question(`${message} (y/N): `);
    return answer.toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

// 主函數
async function initializeNTHUBuildings() {
  try {
    console.log("========================================================");
    console.log("               清華大學建築物初始化工具                  ");
    console.log("========================================================");
    
    const shouldClear = await confirmAction(
      "警告：是否要清空資料庫中所有現有的大學、建築物和廁所資料？\n" +
      "這個操作無法撤銷，所有現有的資料將被永久刪除。"
    );
    
    if (shouldClear) {
      console.log("\n開始清空資料庫...");
      await clearAllCollections();
      console.log("資料庫清空完成！\n");
    } else {
      console.log("\n跳過清空資料庫步驟。\n");
    }
    
    console.log("開始初始化清華大學建築物資料...");
    const universityId = await createUniversityIfNotExists();
    await createBuildings(universityId);
    console.log("\n清華大學建築物初始化完成！");
    
  } catch (error) {
    console.error("\n初始化過程中發生錯誤:", error);
  }
}

// 執行初始化
initializeNTHUBuildings();