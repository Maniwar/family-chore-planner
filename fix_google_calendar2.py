import re
import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace all "bg-white rounded-3xl p-6 border border-slate-200 shadow-xs"
old_card = r"className=\"bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4\""
new_card = r"className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}"
content = content.replace(old_card, new_card)

# Let's fix text-slate-600 headers
old_h3 = r"className=\"text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2\""
new_h3 = r"className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'}`}"
content = content.replace(old_h3, new_h3)

# Fix label
old_label = r"className=\"block text-xs font-medium text-slate-700\""
new_label = r"className={`block text-xs font-medium ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-700 dark:text-slate-300'}`}"
content = content.replace(old_label, new_label)

old_label2 = r"className=\"block text-xs font-medium text-slate-700 mb-1\""
new_label2 = r"className={`block text-xs font-medium mb-1 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-700 dark:text-slate-300'}`}"
content = content.replace(old_label2, new_label2)

# Fix select
old_select = r"className=\"w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500\""
new_select = r"className={`w-full rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 border ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'}`}"
content = content.replace(old_select, new_select)

# Fix input date
old_date = r"className=\"w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500\""
# It matches the same, so if I replaced it, it's covered.

# Create dedicated calendar btn
old_btn = r"className=\"w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center justify-center gap-1.5\""
new_btn = r"className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${isGlassTheme(currentTheme) ? 'bg-white/40 hover:bg-white/60 text-slate-900 border-white/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'}`}"
content = content.replace(old_btn, new_btn)

# Not connected block
old_not_conn = r"className=\"p-4 bg-slate-50 rounded-2xl text-center space-y-3\""
new_not_conn = r"className={`p-4 rounded-2xl text-center space-y-3 ${isGlassTheme(currentTheme) ? 'bg-white/20 border border-white/20' : 'bg-slate-50 dark:bg-slate-900'}`}"
content = content.replace(old_not_conn, new_not_conn)

old_not_conn_text = r"className=\"text-xs text-slate-600\""
new_not_conn_text = r"className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'}`}"
content = content.replace(old_not_conn_text, new_not_conn_text)

with open(filepath, 'w') as f:
    f.write(content)
