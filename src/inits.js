// initializeNTHUSouthCampusBuildings.js

// Using CommonJS syntax
const { db, collection, addDoc, doc, setDoc, getDocs, query, where } = require('../src/firebase/common.js');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

// Building coordinates data from the provided JSON
const buildingsCoordinates = {
  // Cafeterias
  "餐廳": {
    "lat": 24.792609,
    "lng": 120.964003
  },
  "飲虹樓": {
    "lat": 24.792134,
    "lng": 120.963805
  },
  
  // Academic Buildings
  "綜合教學大樓": {
    "lat": 24.793999,
    "lng": 120.964890
  },
  "教學大樓": {
    "lat": 24.793264,
    "lng": 120.965174
  },
  "環文系館": {
    "lat": 24.793647,
    "lng": 120.965858
  },
  "應科系館": {
    "lat": 24.793467,
    "lng": 120.966250
  },
  "中文系館": {
    "lat": 24.793277,
    "lng": 120.965837
  },
  "藝設系館": {
    "lat": 24.793486,
    "lng": 120.964496
  },
  "推廣教育大樓": {
    "lat": 24.793199,
    "lng": 120.965696
  },
  "體育健康教學大樓": {
    "lat": 24.793169,
    "lng": 120.964035
  },
  "音樂系館": {
    "lat": 24.792348,
    "lng": 120.964215
  },
  
  // Administrative/Facilities Buildings
  "圖書館": {
    "lat": 24.794256,
    "lng": 120.965177
  },
  "竹師會館": {
    "lat": 24.793846,
    "lng": 120.965698
  },
  "行政大樓": {
    "lat": 24.793812,
    "lng": 120.965185
  }
};

// Check if the university already exists, if not, create it
async function createUniversityIfNotExists() {
  try {
    // Check if NTHU South Campus already exists
    const universitiesQuery = query(
      collection(db, 'universities'),
      where('name', '==', '國立清華大學南大校區')
    );
    
    const universitiesSnapshot = await getDocs(universitiesQuery);
    
    // If it already exists, return ID
    if (!universitiesSnapshot.empty) {
      const universityDoc = universitiesSnapshot.docs[0];
      console.log("清華大學南大校區記錄已存在，ID: " + universityDoc.id);
      return universityDoc.id;
    }
    
    // If not exists, create university record
    const universityRef = doc(collection(db, 'universities'));
    await setDoc(universityRef, {
      name: '國立清華大學南大校區',
      shortName: '清大南大校區',
      location: '新竹市東區南大路521號',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("成功創建清華大學南大校區記錄！ID: " + universityRef.id);
    return universityRef.id;
  } catch (error) {
    console.error("創建大學記錄時發生錯誤:", error);
    throw error;
  }
}

// Determine building type based on building name
function determineBuildingType(buildingName) {
  if (buildingName.includes('餐廳') || buildingName === '飲虹樓') {
    return 'cafeteria'; // 餐廳
  } else if (buildingName.includes('系館') || buildingName.includes('教學') || buildingName === '體育健康教學大樓' || buildingName === '音樂系館' || buildingName === '推廣教育大樓') {
    return 'academic'; // 教學大樓
  } else if (buildingName === '圖書館') {
    return 'library'; // 圖書館
  } else if (buildingName === '行政大樓') {
    return 'office'; // 辦公大樓
  } else if (buildingName === '竹師會館') {
    return 'venue'; // 會館
  } else {
    return 'other'; // 其他
  }
}

// Create documents for each building
async function createBuildings(universityId) {
  let successCount = 0;
  let totalCount = Object.keys(buildingsCoordinates).length;
  
  for (const [buildingName, coordinates] of Object.entries(buildingsCoordinates)) {
    try {
      // Check if this building already exists
      const buildingsQuery = query(
        collection(db, 'buildings'),
        where('name', '==', buildingName),
        where('universityId', '==', universityId)
      );
      
      const buildingsSnapshot = await getDocs(buildingsQuery);
      
      // If already exists, skip
      if (!buildingsSnapshot.empty) {
        console.log(`建築物 "${buildingName}" 已存在，跳過創建`);
        continue;
      }
      
      // Building data
      const buildingData = {
        name: buildingName,
        universityId: universityId,
        type: determineBuildingType(buildingName),
        floors: 4, // Set to 4 floors as in the original script
        hasElevator: true, // Set to have elevators as in the original script
        lat: coordinates.lat,
        lng: coordinates.lng,
        description: `${buildingName}位於清華大學南大校區內，共有4層樓，設有電梯方便行動不便人士使用。`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create building document
      const docRef = await addDoc(collection(db, "buildings"), buildingData);
      console.log(`成功創建建築物 "${buildingName}" 記錄，ID: ${docRef.id}`);
      successCount++;
      
      // Initialize accessible bathroom records for the building
      await initializeBathroomForBuilding(docRef.id, buildingName);
    } catch (error) {
      console.error(`創建建築物 "${buildingName}" 記錄時發生錯誤:`, error);
    }
  }
  
  console.log(`建築物初始化完成：成功創建 ${successCount}/${totalCount} 個建築物記錄`);
}

// Initialize accessible bathroom records for a building
async function initializeBathroomForBuilding(buildingId, buildingName) {
  try {
    // Check if this building already has bathroom records
    const bathroomsQuery = query(
      collection(db, 'bathrooms'),
      where('buildingId', '==', buildingId)
    );
    
    const bathroomsSnapshot = await getDocs(bathroomsQuery);
    
    // If already exists, skip
    if (!bathroomsSnapshot.empty) {
      console.log(`建築物 "${buildingName}" 已有廁所記錄，跳過創建`);
      return;
    }
    
    // Create data structure for four floors
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
    
    // Bathroom data
    const bathroomData = {
      buildingId: buildingId,
      hasAccessibleBathroom: false, // Default to no accessible bathroom
      floors: floors,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create bathroom record
    const bathroomRef = await addDoc(collection(db, "bathrooms"), bathroomData);
    console.log(`成功創建建築物 "${buildingName}" 的廁所記錄，ID: ${bathroomRef.id}`);
    
  } catch (error) {
    console.error(`創建建築物 "${buildingName}" 的廁所記錄時發生錯誤:`, error);
  }
}

// Request user confirmation
async function confirmAction(message) {
  const rl = readline.createInterface({ input, output });
  
  try {
    const answer = await rl.question(`${message} (y/N): `);
    return answer.toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

// Main function
async function initializeNTHUSouthCampusBuildings() {
  try {
    console.log("========================================================");
    console.log("             清華大學南大校區建築物初始化工具             ");
    console.log("========================================================");
    
    const shouldProceed = await confirmAction(
      "是否要開始初始化清華大學南大校區建築物資料？\n" +
      "此操作不會清空現有資料，只會新增不存在的記錄。"
    );
    
    if (!shouldProceed) {
      console.log("\n取消初始化操作。");
      return;
    }
    
    console.log("\n開始初始化清華大學南大校區建築物資料...");
    const universityId = await createUniversityIfNotExists();
    await createBuildings(universityId);
    console.log("\n清華大學南大校區建築物初始化完成！");
    
  } catch (error) {
    console.error("\n初始化過程中發生錯誤:", error);
  }
}

// Execute initialization
initializeNTHUSouthCampusBuildings();