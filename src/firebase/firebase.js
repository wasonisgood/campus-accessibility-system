
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  doc,
  getDoc,
  updateDoc,  // 添加 updateDoc
  query, 
  where 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase 配置 - 替換為你從Firebase控制台獲取的值
const firebaseConfig = {
    apiKey: "AIzaSyDmcWkJxcqPIxSPWyBSn5yCCIYZPLa69O8",
    authDomain: "nthu-complaints-system.firebaseapp.com",
    projectId: "nthu-complaints-system",
    storageBucket: "nthu-complaints-system.firebasestorage.app",
    messagingSenderId: "348203973438",
    appId: "1:348203973438:web:f2f71715c099e652d14a6f",
    measurementId: "G-G6MED8SJP3"
};
// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 獲取 Firestore 實例
const db = getFirestore(app);

// 獲取 Auth 實例
const auth = getAuth(app);

// 匿名登入函數
const anonymousSignIn = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("匿名登入成功", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("匿名登入失敗:", error);
    throw error;
  }
};

// 導出所有需要的函數和變量
export { 
  app, 
  db, 
  auth, 
  anonymousSignIn, 
  collection, 
  addDoc, 
  getDocs,
  doc,
  getDoc,
  updateDoc,  // 添加 updateDoc
  query, 
  where 
};