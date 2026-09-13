import re

with open('server.ts', 'r') as f:
    content = f.read()

old_join_return = r"""    return res\.json\(\{
      success: true,
      household: sanitizeHousehold\(found\),
      authKey: found\.authKey,
    \}\);"""

new_join_return = """    return res.json({
      success: true,
      household: sanitizeHousehold(found),
      authKey: found.authKey,
      householdCode: found.householdCode,
    });"""
content = re.sub(old_join_return, new_join_return, content)

with open('server.ts', 'w') as f:
    f.write(content)
