import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# syncCompleteHouseholdToCloud(targetHhId, { ... })
# We want to insert `version: activeHousehold?.version,` into the object.
# The calls look like:
# syncCompleteHouseholdToCloud(targetHhId, { logs: updatedLogs })
# syncCompleteHouseholdToCloud(targetHhId, { chores: updated, logs })
# etc.

def replacer(match):
    prefix = match.group(1)
    obj_content = match.group(2)
    suffix = match.group(3)
    if 'version:' in obj_content:
        return match.group(0)
    
    # insert version: activeHousehold?.version, at the beginning of the object
    return f"{prefix}{{ version: activeHousehold?.version, {obj_content} {suffix}"

content = re.sub(r'(syncCompleteHouseholdToCloud\s*\(\s*targetHhId\s*,\s*)\{\s*([\s\S]*?)\s*\}(\s*\))', replacer, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
