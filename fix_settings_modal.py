import re
import os

filepath = 'src/components/HouseSettingsModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Grabber
old_grab = r"className={`${isGlassTheme(currentTheme) ? 'bg-white/10 dark:bg-black/10 backdrop-blur-md' : 'bg-white dark:bg-slate-900'} shrink-0`}"
new_grab = r"className={`${isGlassTheme(currentTheme) ? 'bg-transparent' : 'bg-white dark:bg-slate-900'} shrink-0`}"
content = content.replace(old_grab, new_grab)

# Header
old_header = r"className={`${isGlassTheme(currentTheme) ? 'bg-white/10 dark:bg-black/10 backdrop-blur-md border-white/20 border-b' : 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800'} px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 cursor-grab active:cursor-grabbing select-none`}"
new_header = r"className={`${isGlassTheme(currentTheme) ? 'bg-transparent border-b border-white/20 text-slate-900' : 'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800'} px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 cursor-grab active:cursor-grabbing select-none`}"
content = content.replace(old_header, new_header)

# Subtitle
old_sub = r"className=\"text-xs text-slate-500 truncate\""
new_sub = r"className={`text-xs truncate ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500'}`}"
content = content.replace(old_sub, new_sub)

# Close button
old_close = r"className=\"w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-2\""
new_close = r"className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 ${isGlassTheme(currentTheme) ? 'text-slate-600 hover:bg-white/30' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}"
content = content.replace(old_close, new_close)

# PIN Config Row
old_pin_row = r"className=\"p-4 bg-amber-50/40 dark:bg-amber-950/20 space-y-3\""
new_pin_row = r"className={`p-4 space-y-3 ${isGlassTheme(currentTheme) ? 'bg-white/5 border-t border-white/10' : 'bg-amber-50/40 dark:bg-amber-950/20'}`}"
content = content.replace(old_pin_row, new_pin_row)

old_parent_pin = r"className=\"text-xs text-slate-700 dark:text-slate-300\""
new_parent_pin = r"className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}"
content = content.replace(old_parent_pin, new_parent_pin)

with open(filepath, 'w') as f:
    f.write(content)
