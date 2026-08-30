import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

replacements = [
    # Header
    (r"className={`px-5 py-3.5 border-b flex items-center justify-between backdrop-blur-md shrink-0 ${isGlassTheme(currentTheme) ? 'bg-white/40 dark:bg-black/20 border-white/40' : 'bg-slate-50/80 border-slate-100'}`}",
     r"className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${isGlassTheme(currentTheme) ? 'border-white/20' : 'backdrop-blur-md bg-slate-50/80 border-slate-100'}`}"),
    
    # Title input
    (r"'bg-white/40 border-white/20 focus:bg-white/60'", r"'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]'"),
    
    # Description input
    (r"'bg-white/40 border-white/20 focus:bg-white/60'", r"'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]'"),
    
    # Room/category select
    (r"'bg-white/40 border-white/20'", r"'bg-white/10 backdrop-blur-md border-white/20 text-slate-900'"),
    
    # Number inputs and selects
    (r"'bg-white/40 border-white/20'", r"'bg-white/10 backdrop-blur-md border-white/20 text-slate-900'"),

    # Checklist text input
    (r"'bg-white/40 border-white/20 focus:bg-white/60 text-slate-900'", r"'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]'"),

    # Sticky Footer
    (r"className={`p-3.5 sm:p-4 border-t backdrop-blur-md flex items-center justify-end gap-2.5 shrink-0 safe-area-pb ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40' : 'bg-slate-50/95 border-slate-100'}`}",
     r"className={`p-3.5 sm:p-4 border-t flex items-center justify-end gap-2.5 shrink-0 safe-area-pb ${isGlassTheme(currentTheme) ? 'bg-transparent border-white/20' : 'backdrop-blur-md bg-slate-50/95 border-slate-100'}`}"),
     
    # Footer Cancel button
    (r"className=\"px-4 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors min-h-[44px] cursor-pointer\"",
     r"className={`px-4 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-700 hover:bg-white/30' : 'text-slate-600 hover:bg-slate-200'}`}")
]

if os.path.exists('src/components/ChoreModal.tsx'):
    replace_in_file('src/components/ChoreModal.tsx', replacements)

