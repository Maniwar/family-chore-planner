import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Fix list item selection logic
content = content.replace(
    '''className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-white' : 'bg-slate-50/60 opacity-60'
                    }`}''',
    '''className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      isSelected 
                        ? (isGlassTheme(currentTheme) ? 'bg-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'bg-white dark:bg-slate-800') 
                        : (isGlassTheme(currentTheme) ? 'bg-transparent opacity-60' : 'bg-slate-50/60 dark:bg-slate-900/60 opacity-60')
                    }`}'''
)

with open(filepath, 'w') as f:
    f.write(content)
