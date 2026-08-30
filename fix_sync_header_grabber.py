import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

replacements = [
    (r"<div className={`${theme.heroBannerBg} shrink-0`}>",
     r"<div className={`${isGlassTheme(currentTheme) ? 'bg-transparent' : theme.heroBannerBg} shrink-0`}>")
]

if os.path.exists('src/components/HouseholdSyncModal.tsx'):
    replace_in_file('src/components/HouseholdSyncModal.tsx', replacements)

