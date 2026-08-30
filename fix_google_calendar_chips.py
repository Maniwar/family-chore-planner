import re
import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_chips = r"""className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 cursor-pointer ${
                  filterMemberId === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}"""

new_chips = r"""className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 cursor-pointer ${
                  filterMemberId === 'all'
                    ? (isGlassTheme(currentTheme) ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs')
                    : (isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 hover:bg-white/50 border border-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')
                }`}"""

content = content.replace(old_chips, new_chips)


old_chips2 = r"""className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                    filterMemberId === m.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}"""

new_chips2 = r"""className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                    filterMemberId === m.id
                      ? (isGlassTheme(currentTheme) ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs')
                      : (isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 hover:bg-white/50 border border-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')
                  }`}"""
                  
content = content.replace(old_chips2, new_chips2)

with open(filepath, 'w') as f:
    f.write(content)
