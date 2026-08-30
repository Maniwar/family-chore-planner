import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace panel backgrounds
content = content.replace(
    'className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"',
    'className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? \'apple-glass-card border-white/20\' : \'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700\'}`}'
)

# Replace h3 headers
content = content.replace(
    'className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2"',
    'className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-600 dark:text-slate-400\'}`}'
)

# Right column headers
content = content.replace(
    'className="text-base font-bold text-slate-900"',
    'className={`text-base font-bold ${isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-slate-900 dark:text-white\'}`}'
)

content = content.replace(
    'className="text-xs text-slate-500"',
    'className={`text-xs ${isGlassTheme(currentTheme) ? \'text-slate-700\' : \'text-slate-500 dark:text-slate-400\'}`}'
)

# Label texts
content = content.replace(
    'className="block text-xs font-medium text-slate-700"',
    'className={`block text-xs font-medium ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-700 dark:text-slate-300\'}`}'
)
content = content.replace(
    'className="block text-xs font-medium text-slate-700 mb-1"',
    'className={`block text-xs font-medium mb-1 ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-700 dark:text-slate-300\'}`}'
)

# Not connected block
content = content.replace(
    'className="p-4 bg-slate-50 rounded-2xl text-center space-y-3"',
    'className={`p-4 rounded-2xl text-center space-y-3 ${isGlassTheme(currentTheme) ? \'bg-white/20 border border-white/20\' : \'bg-slate-50 dark:bg-slate-900\'}`}'
)
content = content.replace(
    'className="text-xs text-slate-600"',
    'className={`text-xs ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-600 dark:text-slate-400\'}`}'
)

with open(filepath, 'w') as f:
    f.write(content)
