import { initializeApp, getApps } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCvWDdmEKh9HBIUnK0W7SqX6l_NU3BxDGE",
  authDomain: "friends-chat-app-1f58d.firebaseapp.com",
  databaseURL: "https://friends-chat-app-1f58d-default-rtdb.firebaseio.com",
  projectId: "friends-chat-app-1f58d",
  storageBucket: "friends-chat-app-1f58d.firebasestorage.app",
  messagingSenderId: "790625288361",
  appId: "1:790625288361:android:bcd2018d3447fd662b29b8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: ReturnType<typeof getAuth>;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const { getReactNativePersistence } = require("firebase/auth");
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
