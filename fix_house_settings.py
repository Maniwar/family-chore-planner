import re
import os

filepath = 'src/components/HouseSettingsModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Family Name & Motto labels
content = content.replace(
    'className="text-xs font-bold text-slate-700 dark:text-slate-300 w-32 shrink-0"',
    'className={`text-xs font-bold w-32 shrink-0 ${isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-slate-700 dark:text-slate-300\'}`}'
)

# Text inputs
content = content.replace(
    'className={`flex-1 text-xs font-bold p-2.5 rounded-xl ${isGlassTheme(currentTheme) ? \'bg-white/10 dark:bg-slate-900/30 border-white/20\' : \'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700\'} focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white`}',
    'className={`flex-1 text-xs font-bold p-2.5 rounded-xl border focus:ring-2 focus:ring-rose-500 ${isGlassTheme(currentTheme) ? \'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white\'}`}'
)
content = content.replace(
    'className={`flex-1 text-xs font-medium p-2.5 rounded-xl ${isGlassTheme(currentTheme) ? \'bg-white/10 dark:bg-slate-900/30 border-white/20\' : \'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700\'} focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-200`}',
    'className={`flex-1 text-xs font-medium p-2.5 rounded-xl border focus:ring-2 focus:ring-rose-500 ${isGlassTheme(currentTheme) ? \'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white\'}`}'
)

# Section Headers (MOM / PARENT MODE SECURITY, DATA MAINTENANCE)
content = content.replace(
    'className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1"',
    'className={`text-[11px] font-bold uppercase tracking-wider px-1 ${isGlassTheme(currentTheme) ? \'text-slate-600\' : \'text-slate-400 dark:text-slate-500\'}`}'
)

with open(filepath, 'w') as f:
    f.write(content)

