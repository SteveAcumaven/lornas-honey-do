import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAG8o4UwhnO2lvVWRfbUsEU0ez1B196T1o",
  authDomain: "lornas-honey-do.firebaseapp.com",
  databaseURL: "https://lornas-honey-do-default-rtdb.firebaseio.com",
  projectId: "lornas-honey-do",
  storageBucket: "lornas-honey-do.firebasestorage.app",
  messagingSenderId: "669175084462",
  appId: "1:669175084462:web:a7c5d28a0ea8f51ae7443f",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
