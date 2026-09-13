const fs = require('fs');
let code = fs.readFileSync('src/components/RewardsView.tsx', 'utf8');

code = code.replace(
  /  selectedMemberId\?: string;\n  selectedMemberId\?: string;/,
  "  selectedMemberId?: string;"
);

code = code.replace(
  /  selectedMemberId,\n  selectedMemberId,/,
  "  selectedMemberId,"
);

fs.writeFileSync('src/components/RewardsView.tsx', code);
