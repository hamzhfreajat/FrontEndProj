import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "classifiedsapp-6d4ea",
  // We use the same Android API key since Firebase often allows this for web clients
  // If this fails, the user will need to provide a dedicated Web API key.
  apiKey: "AIzaSyAdXn5vB8YIFpy2b2iXY2Lkzsu8eHOw3hY",
  storageBucket: "classifiedsapp-6d4ea.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
