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
  const snap = await getDoc(doc(db, "households", "hh_j012uv9pk"));
  const data = snap.data();
  console.log("House Photo:", data.housePhotoUrl ? "Yes" : "No");
  let hasMemberPhotos = false;
  data.members?.forEach(m => {
    if (m.avatarPhotoUrl) hasMemberPhotos = true;
  });
  console.log("Member Photos:", hasMemberPhotos ? "Yes" : "No");
  console.log("Logs (History) count:", data.logs?.length || 0);
  console.log("Claims count:", data.claims?.length || 0);
  console.log("Events count:", data.events?.length || 0);
  process.exit(0);
}

run().catch(console.error);
