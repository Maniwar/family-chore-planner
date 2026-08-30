import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# PersonStatusDrawer.tsx remaining
replacements_person = [
    (r'className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"',
     r'className={`rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${isGlassTheme(currentTheme) ? "apple-glass-card border-white/20 hover:border-white/40" : "bg-white border-slate-200/90 hover:border-slate-300"}`}')
]
if os.path.exists('src/components/PersonStatusDrawer.tsx'):
    replace_in_file('src/components/PersonStatusDrawer.tsx', replacements_person)

