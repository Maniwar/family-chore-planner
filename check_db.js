import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const households = await getDocs(collection(db, "households"));
  console.log("Found", households.size, "households");
  households.forEach(doc => {
    console.log("ID:", doc.id, "Name:", doc.data().familyName, "Code:", doc.data().householdCode);
  });
}
run().catch(console.error);
