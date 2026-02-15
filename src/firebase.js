import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQSnychJxr5WG5AN9aD9VlrDs75mAKe3w",
  authDomain: "hospitalapp-25636.firebaseapp.com",
  projectId: "hospitalapp-25636",
  storageBucket: "hospitalapp-25636.firebasestorage.app",
  messagingSenderId: "1084304964417",
  appId: "1:1084304964417:web:feba2d5111d755532e7fc0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
