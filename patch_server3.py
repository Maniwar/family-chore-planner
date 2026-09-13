with open('server.ts', 'r') as f:
    content = f.read()

import re
old_logic = "const isStale = typeof clientVersion === 'number' && clientVersion < (existing.version || 0);"
new_logic = "const isStale = typeof clientVersion !== 'number' || clientVersion < (existing.version || 0);"

content = content.replace(old_logic, new_logic)

with open('server.ts', 'w') as f:
    f.write(content)
