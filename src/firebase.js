// Import necessary modules from Firebase SDK (modular v9+)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBA6p75XDwHcgi1dNBYJo8Crd5tkvdychA",
  authDomain: "kerst-f4518.firebaseapp.com",
  projectId: "kerst-f4518",
  storageBucket: "kerst-f4518.appspot.com",
  messagingSenderId: "224162625624",
  appId: "1:224162625624:web:5cd596811544e850a0b22d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export Firestore database
export { db };
