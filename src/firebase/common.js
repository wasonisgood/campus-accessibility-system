// firebase.js
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc 
} = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDmcWkJxcqPIxSPWyBSn5yCCIYZPLa69O8",
    authDomain: "nthu-complaints-system.firebaseapp.com",
    projectId: "nthu-complaints-system",
    storageBucket: "nthu-complaints-system.firebasestorage.app",
    messagingSenderId: "348203973438",
    appId: "1:348203973438:web:f2f71715c099e652d14a6f",
    measurementId: "G-G6MED8SJP3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the Firestore methods and db
module.exports = {
  db,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc
};