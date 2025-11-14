import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "geneflow-bd716.firebaseapp.com",
    databaseURL: "https://geneflow-bd716-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "geneflow-bd716",
    storageBucket: "geneflow-bd716.firebasestorage.app",
    messagingSenderId: "1080784318629",
    appId: "1:1080784318629:web:5978c7f2e4ef8523155d4c"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
