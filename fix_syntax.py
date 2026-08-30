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
    (r"(theme.heroBannerBorder or 'border-white/10')",
     r"(theme.heroBannerBorder || 'border-white/10')")
]

if os.path.exists('src/components/HouseholdSyncModal.tsx'):
    replace_in_file('src/components/HouseholdSyncModal.tsx', replacements)

