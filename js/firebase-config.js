// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvNSLfo6Bj3adQrfP7uOUY88nBpL3iRP0",
  authDomain: "umichcalendar.firebaseapp.com",
  projectId: "umichcalendar",
  storageBucket: "umichcalendar.firebasestorage.app",
  messagingSenderId: "871016805897",
  appId: "1:871016805897:web:a480968d08e05cca996ad8",
  measurementId: "G-JVJE7XZN4S"
};

console.log('🔵 Initializing Firebase...');

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();

// Firestore collection references
const eventsCollection = db.collection('events');
const sourcesCollection = db.collection('sources');

// Export for use in other files
window.firebaseApp = {
  db,
  eventsCollection,
  sourcesCollection
};

console.log('✅ Firebase initialized successfully');

// Signal that Firebase is ready
window.firebaseReady = true;
if (window.onFirebaseReady) {
  window.onFirebaseReady();
}
