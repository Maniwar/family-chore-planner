import re

with open('src/components/RedemptionsManagerView.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">',
    r'<div className={`p-3 rounded-2xl border text-xs ${isGlassTheme(currentTheme) ? \'apple-glass-card border-rose-300/40 text-rose-900 dark:text-rose-200\' : \'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200\'}`}>',
    content
)

content = re.sub(
    r'<div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">',
    r'<div className={`p-3 rounded-2xl border ${isGlassTheme(currentTheme) ? \'apple-glass-card border-white/40\' : \'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700\'}`}>',
    content
)

with open('src/components/RedemptionsManagerView.tsx', 'w') as f:
    f.write(content)
