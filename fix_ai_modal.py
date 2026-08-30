import re
import os

filepath = 'src/components/AIAssignModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_header = r"""<div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/70 backdrop-blur-sm shrink-0">"""
new_header = r"""<div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${isGlassTheme(currentTheme) ? 'bg-transparent border-white/20' : 'bg-slate-50 dark:bg-slate-900/70 border-slate-100 dark:border-slate-700 backdrop-blur-sm'}`}>"""

content = content.replace(old_header, new_header)

with open(filepath, 'w') as f:
    f.write(content)
