import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure all sync calls have `version: activeHousehold?.version` inside the payload.
def replacer(match):
    prefix = match.group(1)
    obj_content = match.group(2)
    if 'version:' not in obj_content:
        obj_content = f"version: activeHousehold?.version, {obj_content}"
    return f"{prefix}{{{obj_content}}})"

content = re.sub(r'(syncCompleteHouseholdToCloud\s*\([^,]+,\s*)\{([^}]*?)\}\s*\)', replacer, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
