import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const firebaseConfig = {
  projectId: "gen-lang-client-0363709651",
  appId: "1:695929293431:web:a6c2edee5a590b1f2cd472",
  apiKey: "AIzaSyCa0ULQpNl0BxlDGPHgoGldKAwRyRBTC-4",
  authDomain: "gen-lang-client-0363709651.firebaseapp.com"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-familychorequali-6fd3291b-a5f6-400f-9efb-018cfcaff0e9");

async function run() {
  // Try one of the known IDs from test_db.mjs
  const hhId = "hh_01a4f184f868";
  const snap = await getDoc(doc(db, "households", hhId));
  console.log("Snap exists:", snap.exists());
  if (snap.exists()) {
     const data = snap.data();
     console.log("Auth key:", data.authKey);
  }
  process.exit(0);
}
run();
