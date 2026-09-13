import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

replacement = """  const handleResetDemo = () => {
    resetAllToDemo();
    setHouseholdInfo(DEFAULT_HOUSEHOLD_INFO);
    const newMembers = loadStoredMembers();
    const newChores = loadStoredChores();
    const newLogs = loadStoredLogs();
    const newRewards = loadStoredRewards();
    const newClaims = loadStoredClaims();
    setMembers(newMembers);
    setChores(newChores);
    setLogs(newLogs);
    setRewards(newRewards);
    setClaims(newClaims);
    showToast('All household chores, members, photos and demo data reset to default.');
    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        version: activeHousehold.version,
        familyName: DEFAULT_HOUSEHOLD_INFO.familyName,
        houseAddressOrMotto: DEFAULT_HOUSEHOLD_INFO.houseAddressOrMotto,
        housePhotoUrl: DEFAULT_HOUSEHOLD_INFO.housePhotoUrl,
        members: newMembers,
        chores: newChores,
        logs: newLogs,
        rewards: newRewards,
        claims: newClaims,
        events: [],
        nudges: [],
      }).catch((err) => { console.error(err); showToast('Sync failed'); });
    }
  };"""

content = re.sub(r'  const handleResetDemo = \(\) => \{[\s\S]*?showToast\(\'All household chores, members, photos and demo data reset to default\.\'\);\n  \};\n', replacement + "\n", content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
