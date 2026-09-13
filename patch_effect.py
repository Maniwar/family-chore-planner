import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

replacement = """    const dataPayload: any = {
      version: activeHousehold?.version,
      familyName: householdInfo.familyName,"""

content = re.sub(r'const dataPayload = \{\n\s+familyName: householdInfo\.familyName,', replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
