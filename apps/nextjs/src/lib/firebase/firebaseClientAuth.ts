import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaqwBodw8Bew4ZC3evVVRcjgNCPRjYQlU",
  authDomain: "t3-test-b1be7.firebaseapp.com",
  projectId: "t3-test-b1be7",
  storageBucket: "t3-test-b1be7.firebasestorage.app",
  messagingSenderId: "1085735650871",
  appId: "1:1085735650871:web:612622267fc0fbf3ada1b2",
};

const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

const firebaseAuth = getAuth(firebaseApp);

export { firebaseApp, firebaseAuth };

export const googleAuthProvider = new GoogleAuthProvider();

export const signInWithGooglePopUp = (): ReturnType<typeof signInWithPopup> => {
  return signInWithPopup(firebaseAuth, googleAuthProvider);
};

export const signInWithPassword = ({
  email,
  password,
}: {
  email: string;
  password: string;
}): ReturnType<typeof signInWithEmailAndPassword> => {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const firebaseSignOut = () => signOut(firebaseAuth);
