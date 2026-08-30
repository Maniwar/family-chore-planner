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
    (r"className={`px-4 py-3 sm:px-5 sm:py-3.5 ${theme.heroBannerBg} text-white relative overflow-hidden border-b shrink-0 cursor-grab active:cursor-grabbing select-none ${theme.heroBannerBorder || 'border-white/10'}`}",
     r"className={`px-4 py-3 sm:px-5 sm:py-3.5 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-b border-white/20 text-slate-900' : theme.heroBannerBg + ' text-white border-b ' + (theme.heroBannerBorder or 'border-white/10')} relative overflow-hidden shrink-0 cursor-grab active:cursor-grabbing select-none`}"),
     
    (r"<h2 className=\"text-base font-extrabold tracking-tight text-white leading-tight\">",
     r"<h2 className={`text-base font-extrabold tracking-tight leading-tight ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-white'}`}>"),
     
    (r"<p className=\"text-[11px] text-white/90 leading-tight max-w-md truncate\">",
     r"<p className={`text-[11px] leading-tight max-w-md truncate ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-white/90'}`}>"),
     
    (r"className=\"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[9px] font-bold tracking-wider uppercase whitespace-nowrap shadow-2xs\"",
     r"className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase whitespace-nowrap shadow-2xs ${isGlassTheme(currentTheme) ? 'bg-white/40 text-slate-900 border-white/40' : 'bg-white/20 text-white border-white/30'}`}"),
     
    (r"className=\"p-1 text-white/80 hover:text-white rounded-xl hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer shrink-0 -mr-1 -mt-0.5 min-h-[32px] min-w-[32px] flex items-center justify-center ml-2\"",
     r"className={`p-1 rounded-xl transition-colors cursor-pointer shrink-0 -mr-1 -mt-0.5 min-h-[32px] min-w-[32px] flex items-center justify-center ml-2 ${isGlassTheme(currentTheme) ? 'text-slate-700 hover:text-slate-900 hover:bg-white/30 active:bg-white/40' : 'text-white/80 hover:text-white hover:bg-white/15 active:bg-white/25'}`}")
]

if os.path.exists('src/components/HouseholdSyncModal.tsx'):
    replace_in_file('src/components/HouseholdSyncModal.tsx', replacements)

