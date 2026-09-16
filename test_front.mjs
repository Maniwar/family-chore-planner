import fs from 'fs';
fetch('http://localhost:3000/api/household/hh_01a4f184f868').then(r => r.json()).then(console.log);
