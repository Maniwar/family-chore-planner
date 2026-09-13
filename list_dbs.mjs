import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0363709651",
  appId: "1:695929293431:web:a6c2edee5a590b1f2cd472",
  apiKey: "AIzaSyCa0ULQpNl0BxlDGPHgoGldKAwRyRBTC-4",
  authDomain: "gen-lang-client-0363709651.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);

async function checkDb(dbName) {
  try {
    const db = getFirestore(app, dbName);
    const qs = await getDocs(collection(db, "households"));
    console.log(`DB ${dbName}: Found ${qs.size} households.`);
    qs.forEach(d => console.log(` - Code: ${d.data().householdCode}`));
  } catch (e) {
    console.log(`DB ${dbName} failed: ${e.message}`);
  }
}

async function run() {
  await checkDb("(default)");
  await checkDb("ai-studio-familychorequali-6fd3291b-a5f6-400f-9efb-018cfcaff0e9");
  process.exit(0);
}

run();
