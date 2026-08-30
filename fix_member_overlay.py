import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    'className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"',
    'className={`fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4 ${isGlassTheme(currentTheme) ? \'bg-slate-900/15 backdrop-blur-md\' : \'bg-slate-900/60 backdrop-blur-sm\'}`}'
)

# Weekly Points Goal text
content = content.replace(
    'className="text-[11px] text-slate-500 italic"',
    'className={`text-[11px] italic ${isGlassTheme(currentTheme) ? \'text-slate-700\' : \'text-slate-500 dark:text-slate-400\'}`}'
)

with open(filepath, 'w') as f:
    f.write(content)
