import re
import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(r"\'", "'")

with open(filepath, 'w') as f:
    f.write(content)

