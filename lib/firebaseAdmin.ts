import { initializeApp, App, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
var serviceKey = require("@/speech-text-speech-6b769-firebase-adminsdk-fbsvc-4ec382b9fb.json");

// service side
// cert => certified

let app: App;

// not initialize then initialize it if does alredy initialize then get that instance
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(serviceKey),
    storageBucket: "speech-text-speech-6b769.firebasestorage.app",
  });
} else {
  app = getApp();
}

const storage = getStorage(app);
const adminDb = getFirestore(app);

export { storage, adminDb };
