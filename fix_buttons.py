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
    # HouseSettingsModal footer cancel
    (r"className=\"min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer\"",
     r"className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-800 hover:bg-white/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}"),
     
    # Reset Data button
    (r"className=\"min-h-[36px] px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0\"",
     r"className={`min-h-[36px] px-4 py-2 rounded-xl border font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 ${isGlassTheme(currentTheme) ? 'bg-white/30 border-white/40 text-rose-800 hover:bg-white/40' : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'}`}")
]

if os.path.exists('src/components/HouseSettingsModal.tsx'):
    replace_in_file('src/components/HouseSettingsModal.tsx', replacements)

