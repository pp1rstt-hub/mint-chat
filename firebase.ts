import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyB-YourActualKeyбудеТут", 
    authDomain: "mint-chat.firebaseapp.com",
    projectId: "mint-chat",
    storageBucket: "mint-chat.appspot.com",
    messagingSenderId: "1064372554733",
    appId: "1:1064372554733:web:7f6f598282365e69e06876"
};

// Це щоб не було помилок при перевантаженні сторінки
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
