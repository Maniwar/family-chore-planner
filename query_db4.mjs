import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0363709651",
  appId: "1:695929293431:web:a6c2edee5a590b1f2cd472",
  apiKey: "AIzaSyCa0ULQpNl0BxlDGPHgoGldKAwRyRBTC-4",
  authDomain: "gen-lang-client-0363709651.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-familychorequali-6fd3291b-a5f6-400f-9efb-018cfcaff0e9");

async function run() {
  const querySnapshot = await getDocs(collection(db, "households"));
  querySnapshot.forEach((d) => {
    const data = d.data();
    console.log(`Household: ${data.familyName}`);
    console.log(`Code: ${data.householdCode}`);
    console.log(`Members: ${data.members?.length || 0}`);
    console.log(`Chores: ${data.chores?.length || 0}`);
  });
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
