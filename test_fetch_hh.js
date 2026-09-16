import fs from 'fs';
try {
  const data = JSON.parse(fs.readFileSync('./.data/households.json', 'utf8'));
  console.log("Memory store keys:", Object.keys(data));
} catch(e) {
  console.error(e);
}
