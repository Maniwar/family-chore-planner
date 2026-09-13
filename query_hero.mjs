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
  const docRef = doc(db, "households", "hh_j012uv9pk");
  const snap = await getDoc(docRef);
  const data = snap.data();
  console.log("Chores count:", data.chores.length);
  console.log("Rewards count:", data.rewards.length);
  console.log("Motto:", data.houseAddressOrMotto);
  console.log("Admin PIN:", data.adminPin);
  process.exit(0);
}

run().catch(console.error);
