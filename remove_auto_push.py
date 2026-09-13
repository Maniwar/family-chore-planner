import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove the refs
content = re.sub(r'\s*const lastSyncedHashRef = useRef<string>\(\'\'\);\n\s*const isReceivingRemoteUpdateRef = useRef<boolean>\(false\);\n', '\n', content)

# Remove the useEffect
effect_regex = r'\s*// Debounced cloud sync to prevent quota exhaustion and duplicate sync echoes\n\s*useEffect\(\(\) => \{\n\s*if \(!isCloudHydratedRef\.current\) return;\n\s*if \(!activeHousehold\?\.id\) return;\n\s*if \(isReceivingRemoteUpdateRef\.current\) return;[\s\S]*?\}, 600\);\n\n\s*return \(\) => clearTimeout\(timer\);\n\s*\}, \[members, chores, logs, rewards, claims, penaltySettings, events, nudges, householdInfo, activeHousehold\?\.id\]\);\n'
content = re.sub(effect_regex, '\n', content)

# Remove references inside `subscribeHouseholdFull`
update_true = r'\s*isReceivingRemoteUpdateRef\.current = true;\n'
content = re.sub(update_true, '', content)

update_false = r'\s*setTimeout\(\(\) => \{\n\s*isReceivingRemoteUpdateRef\.current = false;\n\s*\}, 100\);\n'
content = re.sub(update_false, '', content)

# Remove lastSyncedHashRef assignments
hash1 = r'\s*lastSyncedHashRef\.current = JSON\.stringify\(\{[\s\S]*?customHouseXp: targetHh\.customHouseXp,\n\s*\}\);\n'
content = re.sub(hash1, '', content)

hash2_block = r'\s*// Update hash so we don\'t reflect this remote update back to the server\n\s*let computedMembers = members;[\s\S]*?lastSyncedHashRef\.current = JSON\.stringify\(\{[\s\S]*?customHouseXp: cloudHh\.customHouseXp !== undefined \? cloudHh\.customHouseXp : householdInfo\.customHouseXp,\n\s*\}\);\n'
content = re.sub(hash2_block, '', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

