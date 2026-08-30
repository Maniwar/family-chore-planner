import re
import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

replacements = [
    (r"className=\"p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3\"",
     r"className={`p-3.5 rounded-2xl border space-y-3 shadow-2xs ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-slate-50 border-slate-200'}`}"),
     
    (r"className=\"block text-xs font-bold uppercase tracking-wider text-slate-700\"",
     r"className={`block text-xs font-bold uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-700'}`}"),
     
    (r"className=\"block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5\"",
     r"className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600'}`}"),

    (r"className=\"block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1\"",
     r"className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600'}`}"),
     
    (r"className=\"inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-colors active:scale-95 cursor-pointer min-h-\[36px\]\"",
     r"className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs transition-colors active:scale-95 cursor-pointer min-h-[36px] border ${isGlassTheme(currentTheme) ? 'bg-white/40 hover:bg-white/60 border-white/20 text-slate-800' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'}`}"),
     
    (r"'bg-slate-100 hover:bg-slate-200 border border-slate-200'",
     r"isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md hover:bg-white/20 border-white/20 text-slate-900' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'"),
     
    (r"className=\{`w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 \$\{theme.accentRing\} font-medium`\}",
     r"className={`w-full text-sm p-3 rounded-xl border focus:ring-2 ${theme.accentRing} font-medium ${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] placeholder:text-slate-500' : 'border-slate-300 bg-white placeholder:text-slate-400'}`}"),
     
    (r"className=\{`w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 \$\{theme.accentRing\}`\}",
     r"className={`w-full text-xs p-2.5 rounded-xl border font-medium focus:ring-2 ${theme.accentRing} ${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : 'border-slate-300 bg-white'}`}"),
     
    (r"className=\{`w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 \$\{theme.accentRing\}`\}",
     r"className={`w-full text-xs p-2.5 rounded-xl border font-medium focus:ring-2 ${theme.accentRing} ${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] placeholder:text-slate-500' : 'border-slate-300 bg-white placeholder:text-slate-400'}`}"),
     
    (r"className=\"p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0\"",
     r"className={`p-4 sm:p-5 border-t flex items-center justify-end gap-3 shrink-0 ${isGlassTheme(currentTheme) ? 'border-white/20 bg-transparent' : 'border-slate-100 bg-slate-50/50'}`}"),
     
    (r"className=\"px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-\[44px\]\"",
     r"className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${isGlassTheme(currentTheme) ? 'text-slate-700 hover:bg-white/30' : 'text-slate-600 hover:bg-slate-100'}`}")
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w') as f:
    f.write(content)

