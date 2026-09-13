import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  console.log("Checking DB...", config.firestoreDatabaseId);
  try {
    const snap = await getDocs(collection(db, "households"));
    console.log("Size:", snap.size);
    snap.forEach(doc => {
      console.log(doc.id, doc.data().familyName, doc.data().householdCode);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
