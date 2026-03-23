import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ============================================================
// FIREBASE SETUP - Replace these values with your own!
//
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Add a Web app
// 4. Copy the config values below
// 5. Then go to Realtime Database > Create Database
//    - Choose your region
//    - Start in TEST MODE (for now)
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
