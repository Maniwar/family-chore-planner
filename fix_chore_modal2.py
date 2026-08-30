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
    (r"'bg-white/40 border-white/20 hover:bg-white/60'", r"'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20'"),
    (r"'bg-white/40 hover:bg-white/60 border-white/20 text-slate-800'", r"'bg-white/10 backdrop-blur-md hover:bg-white/20 border-white/20 text-slate-800'"),
    (r"text-slate-500", r"text-slate-600 dark:text-slate-400"),
    (r"text-slate-400", r"text-slate-500 dark:text-slate-400")
]

if os.path.exists('src/components/ChoreModal.tsx'):
    replace_in_file('src/components/ChoreModal.tsx', replacements)

