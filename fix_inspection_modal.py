import re
import os

filepath = 'src/components/InspectionModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_header1 = r"""? 'apple-glass-header border-white/30 text-slate-900'"""
new_header1 = r"""? 'bg-transparent border-white/20 text-slate-900'"""
content = content.replace(old_header1, new_header1)

old_header2 = r""": 'apple-glass-header border-white/30 text-slate-900'"""
new_header2 = r""": 'bg-transparent border-white/20 text-slate-900'"""
content = content.replace(old_header2, new_header2)


with open(filepath, 'w') as f:
    f.write(content)

