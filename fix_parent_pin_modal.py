import re
import os

filepath = 'src/components/ParentPinModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_header = r"""<div className={`${isGlassTheme(currentTheme) ? 'apple-glass-header text-slate-900 dark:text-white border-b border-white/20' : theme.primaryBg + ' ' + theme.primaryText} p-4 sm:p-5 flex items-center justify-between`}>"""
new_header = r"""<div className={`${isGlassTheme(currentTheme) ? 'bg-transparent text-slate-900 dark:text-white border-b border-white/20' : theme.primaryBg + ' ' + theme.primaryText} p-4 sm:p-5 flex items-center justify-between`}>"""
content = content.replace(old_header, new_header)

with open(filepath, 'w') as f:
    f.write(content)

