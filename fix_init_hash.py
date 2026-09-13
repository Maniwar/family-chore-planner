with open('src/App.tsx', 'r') as f:
    content = f.read()

import re

old_hash = r"""          lastSyncedHashRef\.current = JSON\.stringify\(\{
            familyName: targetHh\.familyName,"""

new_hash = """          lastSyncedHashRef.current = JSON.stringify({
            version: targetHh.version,
            familyName: targetHh.familyName,"""

content = re.sub(old_hash, new_hash, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
