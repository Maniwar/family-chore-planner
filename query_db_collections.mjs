import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

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
  console.log(`Found ${querySnapshot.size} households.`);
  querySnapshot.forEach((d) => {
    const data = d.data();
    console.log(`Code: ${data.householdCode}`);
  });
  
  // Try querying specifically for STAR-BXM4
  const q2 = await getDocs(collection(db, "households"));
  let found = false;
  q2.forEach(d => {
    if (d.data().householdCode?.includes('STAR')) {
      found = true;
      console.log('Found STAR code:', d.id);
    }
  });
  if(!found) console.log('No STAR code found');
  
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
