export const firebaseConfig = {
  apiKey: "AIzaSyBbA9rEgg8CYocsx2Lop4NtKaV1RTYEA1g",
  authDomain: "hobby-site-f8f72.firebaseapp.com",
  projectId: "hobby-site-f8f72",
  storageBucket: "hobby-site-f8f72.firebasestorage.app",
  messagingSenderId: "1086488905484",
  appId: "1:1086488905484:web:9d3cd33f535a23c13feb29",
  measurementId: "G-G0G83J7XN0"
};

export const FIREBASE_CONFIG = {
  projectId: firebaseConfig.projectId,
  databaseId: "(default)",
  productsCollection: "products"
};

export const FIRESTORE_DOCUMENTS_URL =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.databaseId}/documents`;
