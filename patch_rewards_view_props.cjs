const fs = require('fs');
let code = fs.readFileSync('src/components/RewardsView.tsx', 'utf8');

// 1. Add selectedMemberId to interface
code = code.replace(
  /interface RewardsViewProps \{/,
  "interface RewardsViewProps {\n  selectedMemberId?: string;"
);

// 2. Add selectedMemberId to destructured props
code = code.replace(
  /export const RewardsView: React\.FC<RewardsViewProps> = \(\{/,
  "export const RewardsView: React.FC<RewardsViewProps> = ({\n  selectedMemberId,"
);

// 3. Update initial state of selectedFilterMemberId
code = code.replace(
  /const \[selectedFilterMemberId, setSelectedFilterMemberId\] = useState<string>\('all'\);/,
  `const [selectedFilterMemberId, setSelectedFilterMemberId] = useState<string>(
    (!isMomMode && selectedMemberId && selectedMemberId !== 'all') ? selectedMemberId : 'all'
  );`
);

// 4. Update initial state of selectedClaimMemberId
code = code.replace(
  /const \[selectedClaimMemberId, setSelectedClaimMemberId\] = useState<string>\([\s\S]*?\);/,
  `const [selectedClaimMemberId, setSelectedClaimMemberId] = useState<string>(
    (!isMomMode && selectedMemberId && selectedMemberId !== 'all') 
      ? selectedMemberId 
      : (members.find(m => m.role !== 'parent')?.id || members[0]?.id || '')
  );`
);

fs.writeFileSync('src/components/RewardsView.tsx', code);

const fs2 = require('fs');
let code2 = fs2.readFileSync('src/components/RewardsView.tsx', 'utf8');

const hookCode = `  useEffect(() => {
    if (!isMomMode && selectedMemberId && selectedMemberId !== 'all') {
      setSelectedFilterMemberId(selectedMemberId);
      setSelectedClaimMemberId(selectedMemberId);
    }
  }, [selectedMemberId, isMomMode]);

  const theme = THEMES[currentTheme] || THEMES.rose;`;

code2 = code2.replace(/  const theme = THEMES\[currentTheme\] \|\| THEMES\.rose;/, hookCode);
fs2.writeFileSync('src/components/RewardsView.tsx', code2);
