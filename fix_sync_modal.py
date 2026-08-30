import re
import os

filepath = 'src/components/HouseholdSyncModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_input = r"'bg-white/40 border-white/20 focus:bg-white/60 text-slate-900'"
new_input = r"'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] placeholder:text-slate-500'"

content = content.replace(old_input, new_input)

# Check the apple-glass-card header
old_header = r"'apple-glass-card border-b border-white/20 text-slate-900'"
new_header = r"'bg-transparent border-b border-white/20 text-slate-900'"
content = content.replace(old_header, new_header)


with open(filepath, 'w') as f:
    f.write(content)

