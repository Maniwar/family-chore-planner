const fs = require('fs');
let code = fs.readFileSync('src/components/ChoreCard.tsx', 'utf8');

// Replace standard dependency arrays with JSON stringified checks for objects
code = code.replace(
  /React\.useEffect\(\(\) => \{\n    setCheckedItems\(log\?.checklistStatus \|\| \{\}\);\n  \}, \[log\?.checklistStatus\]\);/g,
  `React.useEffect(() => {
    setCheckedItems(log?.checklistStatus || {});
  }, [JSON.stringify(log?.checklistStatus)]);`
);

fs.writeFileSync('src/components/ChoreCard.tsx', code);
