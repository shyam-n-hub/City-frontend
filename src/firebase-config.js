import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjGCcel1XBwM4rtUj1QkJkq97ql3x5dA4",
  authDomain: "smart-city-64cd5.firebaseapp.com",
  databaseURL: "https://smart-city-64cd5-default-rtdb.firebaseio.com/",
  projectId: "smart-city-64cd5",
  storageBucket: "smart-city-64cd5.firebasestorage.app",
  messagingSenderId: "568531212371",
  appId: "1:568531212371:web:9b84f5b9c3a2f3904f4ea6",
  measurementId: "G-73R5W0TBQ0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app); // Changed from 'db' to 'database'
export const storage = getStorage(app);

// Also export as 'db' for backward compatibility if needed elsewhere
export const db = database;