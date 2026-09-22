// Firebase initialization belongs here.
// Keep runtime keys/config in platform environment configuration.
// Prefer the native Firebase SDK stack for Auth, Firestore, RTDB, Storage,
// Messaging, Crashlytics and App Check in the production React Native app.

export const firebaseServices = {
  auth: 'firebase-auth',
  firestore: 'cloud-firestore',
  realtime: 'realtime-database',
  functions: 'cloud-functions',
  storage: 'cloud-storage',
  messaging: 'fcm',
  appCheck: 'app-check',
} as const;
