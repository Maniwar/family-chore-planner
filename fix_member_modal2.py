import re
import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    'className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"',
    'className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-600\'}`}'
)

content = content.replace(
    'className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"',
    'className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-600\'}`}'
)

with open(filepath, 'w') as f:
    f.write(content)
