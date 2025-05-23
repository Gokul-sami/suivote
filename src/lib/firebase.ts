import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTezXg7TD8o5OMeHFqrYf5dBDXhoSCdIA",
  authDomain: "suivote-cb66a.firebaseapp.com",
  projectId: "suivote-cb66a",
  storageBucket: "suivote-cb66a.firebasestorage.app",
  messagingSenderId: "537374641877",
  appId: "1:537374641877:web:32299005cdd5b622469c5c",
  measurementId: "G-QH2H3DWBPF"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
