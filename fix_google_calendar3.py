import re
import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Fix date input
old_date = r"className=\"w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800\""
new_date = r"className={`w-full p-2.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-indigo-500 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'}`}"
content = content.replace(old_date, new_date)

# Fix amber block
old_amber = r"className=\"p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-tight space-y-1\""
new_amber = r"className={`p-3 rounded-xl border text-[11px] leading-tight space-y-1 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 text-amber-900' : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-900/40 dark:text-amber-200'}`}"
content = content.replace(old_amber, new_amber)

# Sync Button
old_sync_btn = r"className=\"w-full py-3.5 px-4 rounded-2xl text-xs font-black bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white shadow-md transition-all flex items-center justify-center gap-2\""
new_sync_btn = r"className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}"
content = content.replace(old_sync_btn, new_sync_btn)

# Open Google Calendar Button
old_open = r"className=\"w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5\""
new_open = r"className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${isGlassTheme(currentTheme) ? 'border-white/20 hover:bg-white/40 text-slate-800' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'}`}"
content = content.replace(old_open, new_open)


# Right column headers
old_rh3 = r"className=\"text-base font-bold text-slate-900\""
new_rh3 = r"className={`text-base font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}"
content = content.replace(old_rh3, new_rh3)

old_rh_p = r"className=\"text-xs text-slate-500\""
new_rh_p = r"className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}"
content = content.replace(old_rh_p, new_rh_p)

with open(filepath, 'w') as f:
    f.write(content)
