import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_set = r"""    const unsubscribe = subscribeHouseholdFull\(targetHhId, \(cloudHh\) => \{
      if \(\!isMounted\) return;
      setActiveHousehold\(cloudHh\);"""

new_set = """    const unsubscribe = subscribeHouseholdFull(targetHhId, (cloudHh) => {
      if (!isMounted) return;
      setActiveHousehold(prev => ({
        ...cloudHh,
        householdCode: cloudHh.householdCode || prev?.householdCode
      }));"""
content = re.sub(old_set, new_set, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
