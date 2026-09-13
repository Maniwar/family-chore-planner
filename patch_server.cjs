const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /existing\.version = \(existing\.version \|\| 0\) \+ 1;\n\n    householdsMemoryStore\[hhId\] = existing;/g,
  `existing.version = (existing.version || 0) + 1;
    console.log("SYNC RECEIVED FOR", hhId, "PAYLOAD KEYS:", Object.keys(req.body));
    householdsMemoryStore[hhId] = existing;`
);

fs.writeFileSync('server.ts', code);
