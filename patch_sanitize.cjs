const fs = require('fs');
let code = fs.readFileSync('src/utils/storage.ts', 'utf8');

code = code.replace(
  /    \/\/ Chores cannot be completed or submitted for inspection before their scheduled date\n    if \(l\.date && l\.date > today\) return false;/g,
  `    // Removed date > today restriction so future pending checklists can sync`
);

fs.writeFileSync('src/utils/storage.ts', code);
