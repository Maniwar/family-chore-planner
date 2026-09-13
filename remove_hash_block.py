import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# I will just remove the whole `lastSyncedHashRef.current = JSON.stringify({ ... });` block
# It starts around line 654 and ends at 671

hash_block = r'\s*lastSyncedHashRef\.current = JSON\.stringify\(\{[\s\S]*?customHouseXp: cloudHh\.customHouseXp !== undefined \? cloudHh\.customHouseXp : householdInfo\.customHouseXp,\n\s*\}\);\n'
content = re.sub(hash_block, '', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
