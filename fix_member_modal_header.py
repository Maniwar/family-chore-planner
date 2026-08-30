import re
import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Grabber wrapper
old_grabber = r"""<div className={`${isGlassTheme(currentTheme) ? 'apple-glass-header text-slate-900 border-b border-white/40' : theme.primaryBg} shrink-0`}>"""
new_grabber = r"""<div className={`${isGlassTheme(currentTheme) ? 'bg-transparent border-b border-white/20' : theme.primaryBg} shrink-0`}>"""
content = content.replace(old_grabber, new_grabber)

# Header wrapper
old_header = r"""className={`${isGlassTheme(currentTheme) ? 'apple-glass-header text-slate-900 border-b border-white/40' : theme.primaryBg + ' text-white'} px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-xs shrink-0 cursor-grab active:cursor-grabbing select-none`}"""
new_header = r"""className={`${isGlassTheme(currentTheme) ? 'bg-transparent text-slate-900 border-b border-white/20' : theme.primaryBg + ' text-white'} px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-xs shrink-0 cursor-grab active:cursor-grabbing select-none`}"""
content = content.replace(old_header, new_header)


# Check bottom buttons
old_button = r"className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : `${theme.primaryBg} ${theme.primaryHover} text-white`}`}"
# it looks fine, it uses apple-glass-button-primary

with open(filepath, 'w') as f:
    f.write(content)

