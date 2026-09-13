import re

with open('src/utils/firebaseSync.ts', 'r') as f:
    content = f.read()

old_find = r"""        if \(data\.household && data\.authKey\) \{
          setHouseholdAuthToken\(data\.household\.id, data\.authKey\);
          return data\.household as CloudHousehold;
        \}"""

new_find = """        if (data.household && data.authKey) {
          setHouseholdAuthToken(data.household.id, data.authKey);
          const hh = data.household as CloudHousehold;
          if (data.householdCode) hh.householdCode = data.householdCode;
          return hh;
        }"""
content = re.sub(old_find, new_find, content)

with open('src/utils/firebaseSync.ts', 'w') as f:
    f.write(content)
