import re
import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Weekly target points input
old_input = r"className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-amber-900 focus:ring-2 ${theme.accentRing}`}"
new_input = r"className={`w-full text-xs p-2.5 rounded-xl border font-bold focus:ring-2 ${theme.accentRing} ${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] placeholder:text-slate-500' : 'border-slate-300 text-amber-900 bg-white placeholder:text-slate-400'}`}"
content = content.replace(old_input, new_input)

# Target hint text
old_hint = r"className=\"text-[11px] text-slate-400 mt-1\""
new_hint = r"className={`text-[11px] mt-1 ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-400'}`}"
content = content.replace(old_hint, new_hint)

# Buttons div
old_buttons = r"className=\"pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0\""
new_buttons = r"className={`pt-4 border-t flex items-center justify-end gap-2 shrink-0 ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200'}`}"
content = content.replace(old_buttons, new_buttons)

# Cancel button
old_cancel = r"className=\"px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer\""
new_cancel = r"className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-700 hover:bg-white/30' : 'text-slate-600 hover:bg-slate-100'}`}"
content = content.replace(old_cancel, new_cancel)

with open(filepath, 'w') as f:
    f.write(content)
