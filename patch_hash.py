import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

replacement = """      let computedMembers = members;
      if (cloudHh.members && cloudHh.members.length > 0) {
          computedMembers = cloudHh.members.map(cm => {
            const localMatch = members.find(lm => lm.id === cm.id);
            if (localMatch?.avatarPhotoUrl && (!cm.avatarPhotoUrl || cm.avatarPhotoUrl.trim() === '')) {
              return { ...cm, avatarPhotoUrl: localMatch.avatarPhotoUrl };
            }
            return cm;
          });
      }
      
      let computedChores = chores;
      if (cloudHh.chores && cloudHh.chores.length > 0) {
          computedChores = cloudHh.chores;
      }
      
      let computedLogs = logs;
      if (cloudHh.logs) {
          computedLogs = sanitizeLogs(cloudHh.logs);
      }
      
      lastSyncedHashRef.current = JSON.stringify({
        version: cloudHh.version,
        familyName: cloudHh.familyName || householdInfo.familyName,
        houseAddressOrMotto: cloudHh.houseAddressOrMotto || householdInfo.houseAddressOrMotto,
        housePhotoUrl: cloudHh.housePhotoUrl || householdInfo.housePhotoUrl,
        householdCode: cloudHh.householdCode,
        adminPin: cloudHh.adminPin || getParentPin(),
        pinProtectionEnabled: cloudHh.pinProtectionEnabled !== undefined ? cloudHh.pinProtectionEnabled : isPinProtectionEnabled(),
        members: computedMembers,
        chores: computedChores,
        logs: computedLogs,
        rewards: activeRewardsList,
        claims: cloudHh.claims || claims,
        penaltySettings: cloudHh.penaltySettings || penaltySettings,
        events: cloudHh.events || events,
        nudges: cloudHh.nudges || nudges,
        customHouseXp: cloudHh.customHouseXp !== undefined ? cloudHh.customHouseXp : householdInfo.customHouseXp,
      });"""

content = re.sub(r'lastSyncedHashRef\.current = JSON\.stringify\(\{\n\s+familyName: cloudHh\.familyName,[\s\S]*?customHouseXp: cloudHh\.customHouseXp,\n\s+\}\);', replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
