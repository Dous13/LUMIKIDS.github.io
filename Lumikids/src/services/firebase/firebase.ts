import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, initializeAuth, inMemoryPersistence } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const productionConfig = {
  apiKey: "AIzaSyBGs_sMUWlMxyc31UZQe9ZhKHVDLuBydTA",
  authDomain: "lumikids-a94d8.firebaseapp.com",
  projectId: "lumikids-a94d8",
  storageBucket: "lumikids-a94d8.firebasestorage.app",
  messagingSenderId: "39973990853",
  appId: "1:39973990853:web:d8cae5b7d50509110f9bac",
  measurementId: "G-6270691B6D",
};

const emulatorHost = __DEV__ ? process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST : undefined;
const app = initializeApp(emulatorHost
  ? { projectId: "demo-lumikids", apiKey: "demo-api-key", authDomain: "demo-lumikids.firebaseapp.com" }
  : productionConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, { persistence: inMemoryPersistence });
export const functions = getFunctions(app);

if (emulatorHost) {
  connectAuthEmulator(auth, "http://" + emulatorHost + ":9099", { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
}

export function clearLegacyTeacherAuthStorage() {
  return AsyncStorage.multiRemove([
    "teacherSession",
    "firebase:authUser:" + productionConfig.apiKey + ":" + app.name,
  ]);
}
