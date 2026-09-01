import os

filepath = 'src/components/Header.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add Smartphone to icons
content = content.replace(
    'CloudCheck',
    'CloudCheck,\n  Smartphone,\n  Monitor'
)

# Add props
content = content.replace(
    '  isMomMode: boolean;',
    '  isMomMode: boolean;\n  forceMobileUi?: boolean;\n  onToggleMobileUi?: () => void;'
)

content = content.replace(
    '  isMomMode,',
    '  isMomMode,\n  forceMobileUi,\n  onToggleMobileUi,'
)

with open(filepath, 'w') as f:
    f.write(content)
