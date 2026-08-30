import re
import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_italic = r"className=\"text-[11px] text-slate-500 italic\""
new_italic = r"className={`text-[11px] italic ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500'}`}"
content = content.replace(old_italic, new_italic)

old_error = r"className=\"text-[11px] font-semibold text-rose-600\""
new_error = r"className={`text-[11px] font-semibold ${isGlassTheme(currentTheme) ? 'text-rose-700' : 'text-rose-600'}`}"
content = content.replace(old_error, new_error)

old_photo_text = r"className=\"text-[11px] text-slate-500\""
new_photo_text = r"className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500'}`}"
content = content.replace(old_photo_text, new_photo_text)


with open(filepath, 'w') as f:
    f.write(content)
