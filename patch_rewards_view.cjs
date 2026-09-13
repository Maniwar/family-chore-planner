const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<RewardsView\n            rewards=\{rewards\}/,
  `<RewardsView\n            selectedMemberId={selectedMemberId}\n            rewards={rewards}`
);
fs.writeFileSync('src/App.tsx', code);
