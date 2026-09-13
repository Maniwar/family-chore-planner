import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace all occurrences of:
# const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
# syncCompleteHouseholdToCloud(targetHhId, { ... }).catch(console.warn);
# 
# We need to make sure syncCompleteHouseholdToCloud is only called if targetHhId is truthy.
# Let's just replace:
# const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
# with
# const targetHhId = activeHousehold?.id || getCurrentHouseholdId();

content = content.replace(" || 'household_default'", "")

# Now we need to wrap the syncCompleteHouseholdToCloud call in an if statement, or change the function to handle null.
# Actually, changing the function syncCompleteHouseholdToCloud to handle null is easier. Let's do that!
with open('src/App.tsx', 'w') as f:
    f.write(content)
