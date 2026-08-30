import re
import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Chores item backgrounds
old_item = r"className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${\n                      isSelected ? 'bg-white' : 'bg-slate-50/60 opacity-60'\n                    }`}"
new_item = r"className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${isSelected ? (isGlassTheme(currentTheme) ? 'bg-white/20' : 'bg-white dark:bg-slate-800') : (isGlassTheme(currentTheme) ? 'bg-transparent opacity-60' : 'bg-slate-50/60 dark:bg-slate-900/60 opacity-60')}`}"
content = content.replace(old_item, new_item)

old_chore_title = r"className=\"text-xs font-bold text-slate-900 truncate\""
new_chore_title = r"className={`text-xs font-bold truncate ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}"
content = content.replace(old_chore_title, new_chore_title)

old_chore_meta = r"className=\"text-[11px] text-slate-500 flex items-center gap-2 mt-0.5\""
new_chore_meta = r"className={`text-[11px] flex items-center gap-2 mt-0.5 ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}"
content = content.replace(old_chore_meta, new_chore_meta)

old_chore_badge = r"className=\"text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600\""
new_chore_badge = r"className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 border border-white/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}"
content = content.replace(old_chore_badge, new_chore_badge)

old_member_badge = r"className=\"flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-slate-800\""
new_member_badge = r"className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border ${isGlassTheme(currentTheme) ? 'bg-white/30 border-white/20 text-slate-900' : 'bg-amber-50 border-amber-200 text-slate-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'}`}"
content = content.replace(old_member_badge, new_member_badge)

# Sync History Logs Card
old_logs_card = r"className=\"bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4\""
new_logs_card = r"className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}"
content = content.replace(old_logs_card, new_logs_card)

# Empty logs
old_empty = r"className=\"text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200\""
new_empty = r"className={`text-center py-8 text-xs rounded-2xl border border-dashed ${isGlassTheme(currentTheme) ? 'text-slate-600 bg-white/10 border-white/30' : 'text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}"
content = content.replace(old_empty, new_empty)

# Log items
old_log_item = r"className=\"p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs\""
new_log_item = r"className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}"
content = content.replace(old_log_item, new_log_item)

old_log_title = r"className=\"font-bold text-slate-900 truncate\""
new_log_title = r"className={`font-bold truncate ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}"
content = content.replace(old_log_title, new_log_title)

old_log_meta = r"className=\"text-[11px] text-slate-500\""
new_log_meta = r"className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}"
content = content.replace(old_log_meta, new_log_meta)


with open(filepath, 'w') as f:
    f.write(content)
