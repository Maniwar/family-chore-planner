import re
import os

filepath = 'src/components/HouseSettingsModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_subtext = r"className=\"text-\[11px\] text-slate-500\""
new_subtext = r"className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}"
content = content.replace(old_subtext, new_subtext)

old_reset_title = r"className=\"text-xs font-bold text-slate-800 dark:text-slate-200\""
new_reset_title = r"className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-800 dark:text-slate-200'}`}"
content = content.replace(old_reset_title, new_reset_title)


with open(filepath, 'w') as f:
    f.write(content)
