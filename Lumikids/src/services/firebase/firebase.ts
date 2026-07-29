import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGs_sMUWlMxyc31UZQe9ZhKHVDLuBydTA",
  authDomain: "lumikids-a94d8.firebaseapp.com",
  projectId: "lumikids-a94d8",
  storageBucket: "lumikids-a94d8.firebasestorage.app",
  messagingSenderId: "39973990853",
  appId: "1:39973990853:web:d8cae5b7d50509110f9bac",
  measurementId: "G-6270691B6D",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);