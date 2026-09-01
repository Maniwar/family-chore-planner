import os

filepath = 'src/components/Navigation.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    '  dimmed?: boolean;',
    '  dimmed?: boolean;\n  forceMobileUi?: boolean;'
)

content = content.replace(
    '  dimmed = false,',
    '  dimmed = false,\n  forceMobileUi = false,'
)

content = content.replace(
    'hidden md:block sticky top-[57px]',
    '${forceMobileUi ? \'hidden\' : \'hidden md:block\'} sticky top-[57px]'
)

content = content.replace(
    'className={`md:hidden fixed bottom-0',
    'className={`fixed bottom-0 ${forceMobileUi ? \'flex\' : \'md:hidden\'}'
)

with open(filepath, 'w') as f:
    f.write(content)
