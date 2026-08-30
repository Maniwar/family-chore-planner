import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Select & Input Date
content = content.replace(
    'className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"',
    'className={`w-full rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 border ${isGlassTheme(currentTheme) ? \'bg-white/20 border-white/30 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200\'}`}'
)

content = content.replace(
    'className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"',
    'className={`w-full p-2.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-indigo-500 ${isGlassTheme(currentTheme) ? \'bg-white/20 border-white/30 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200\'}`}'
)

# Amber warning block
content = content.replace(
    'className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-tight space-y-1"',
    'className={`p-3 rounded-xl border text-[11px] leading-tight space-y-1 ${isGlassTheme(currentTheme) ? \'bg-white/20 border-white/30 text-amber-900\' : \'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-900/40 dark:text-amber-200\'}`}'
)

# Buttons
content = content.replace(
    'className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"',
    'className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${isGlassTheme(currentTheme) ? \'bg-white/40 hover:bg-white/60 text-slate-900 border-white/30\' : \'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300\'}`}'
)

content = content.replace(
    'className="w-full py-3.5 px-4 rounded-2xl text-xs font-black bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white shadow-md transition-all flex items-center justify-center gap-2"',
    'className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${isGlassTheme(currentTheme) ? \'apple-glass-button-primary\' : \'bg-slate-900 hover:bg-slate-800 text-white\'}`}'
)

content = content.replace(
    'className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"',
    'className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${isGlassTheme(currentTheme) ? \'border-white/20 hover:bg-white/40 text-slate-800\' : \'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800\'}`}'
)

# Chores titles
content = content.replace(
    'className="text-xs font-bold text-slate-900 truncate"',
    'className={`text-xs font-bold truncate ${isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-slate-900 dark:text-white\'}`}'
)

content = content.replace(
    'className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5"',
    'className={`text-[11px] flex items-center gap-2 mt-0.5 ${isGlassTheme(currentTheme) ? \'text-slate-700\' : \'text-slate-500 dark:text-slate-400\'}`}'
)

content = content.replace(
    'className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"',
    'className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isGlassTheme(currentTheme) ? \'bg-white/30 text-slate-800 border border-white/20\' : \'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300\'}`}'
)

content = content.replace(
    'className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-slate-800"',
    'className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border ${isGlassTheme(currentTheme) ? \'bg-white/30 border-white/20 text-slate-900\' : \'bg-amber-50 border-amber-200 text-slate-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200\'}`}'
)

# Logs empty
content = content.replace(
    'className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200"',
    'className={`text-center py-8 text-xs rounded-2xl border border-dashed ${isGlassTheme(currentTheme) ? \'text-slate-600 bg-white/10 border-white/30\' : \'text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700\'}`}'
)

# Log items
content = content.replace(
    'className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"',
    'className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${isGlassTheme(currentTheme) ? \'bg-white/20 border-white/30\' : \'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700\'}`}'
)

content = content.replace(
    'className="font-bold text-slate-900 truncate"',
    'className={`font-bold truncate ${isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-slate-900 dark:text-white\'}`}'
)

content = content.replace(
    'className="text-[11px] text-slate-500"',
    'className={`text-[11px] ${isGlassTheme(currentTheme) ? \'text-slate-700\' : \'text-slate-500 dark:text-slate-400\'}`}'
)

with open(filepath, 'w') as f:
    f.write(content)
