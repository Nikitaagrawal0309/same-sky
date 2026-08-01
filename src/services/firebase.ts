import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD7c6b5lErGaFDnMQsKd7E_V6w5MZXGdbM",
  authDomain: "tracker-25c92.firebaseapp.com",
  databaseURL: "https://tracker-25c92-default-rtdb.firebaseio.com",
  projectId: "tracker-25c92",
  storageBucket: "tracker-25c92.firebasestorage.app",
  messagingSenderId: "442090900397",
  appId: "1:442090900397:web:f6327bd6aaa5669d4baf24",
  measurementId: "G-2HM3J1PF4B"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;