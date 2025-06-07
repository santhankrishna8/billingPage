// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const environment = {
    production: false,
  firebaseConfig: {
  apiKey: "AIzaSyDw-eSqWR9RyxsZkr22qgAwdGKrru71zIs",
  authDomain: "billing-software-c3cc8.firebaseapp.com",
  projectId: "billing-software-c3cc8",
  storageBucket: "billing-software-c3cc8.firebasestorage.app",
  messagingSenderId: "179719025108",
  appId: "1:179719025108:web:4f52d6cf2ee65eb8396641",
  measurementId: "G-71CNZ2H69B"
  }
};

// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);
const analytics = getAnalytics(app);