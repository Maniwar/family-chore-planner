import os

filepath = 'src/components/MemberModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace inputs
content = content.replace(
    'className={`w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 ${theme.accentRing} font-medium`}',
    'className={`w-full text-sm p-3 rounded-xl font-medium focus:ring-2 ${theme.accentRing} border ${isGlassTheme(currentTheme) ? \'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white\'}`}'
)

content = content.replace(
    'className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 ${theme.accentRing}`}',
    'className={`w-full text-xs p-2.5 rounded-xl font-medium focus:ring-2 ${theme.accentRing} border ${isGlassTheme(currentTheme) ? \'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white\'}`}'
)

content = content.replace(
    'className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 ${theme.accentRing}`}',
    'className={`w-full text-xs p-2.5 rounded-xl font-medium focus:ring-2 ${theme.accentRing} border ${isGlassTheme(currentTheme) ? \'bg-white/10 backdrop-blur-md border-white/20 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]\' : \'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white\'}`}'
)

# Photo box
content = content.replace(
    'className={`rounded-2xl p-4 sm:p-6 mb-2 border flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden transition-all ${isGlassTheme(currentTheme) ? \'bg-white/20 border-white/30\' : \'bg-slate-50 border-slate-200\'}`}',
    'className={`rounded-2xl p-4 sm:p-6 mb-2 border flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden transition-all ${isGlassTheme(currentTheme) ? \'apple-glass-card border-white/20\' : \'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700\'}`}'
)

content = content.replace(
    'className={`flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer border ${isGlassTheme(currentTheme) ? \'border-transparent text-slate-800\' : \'border-slate-200 text-slate-700\'}`}',
    'className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer border ${isGlassTheme(currentTheme) ? \'bg-white/40 hover:bg-white/60 border-white/20 text-slate-900\' : \'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700\'}`}'
)

content = content.replace(
    'className={`text-xs text-center sm:text-left ${isGlassTheme(currentTheme) ? \'text-slate-600\' : \'text-slate-500\'}`}',
    'className={`text-xs text-center sm:text-left ${isGlassTheme(currentTheme) ? \'text-slate-700 font-medium\' : \'text-slate-500 dark:text-slate-400\'}`}'
)

content = content.replace(
    'className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer bg-white border ${',
    'className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer border ${isGlassTheme(currentTheme) ? \'bg-white/20 border-white/20 hover:bg-white/40\' : \'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700\'} ${'
)

# And fix the emoji selection background string directly above because I didn't match the whole line.
content = content.replace(
    '''className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer bg-white border ${
                  avatarEmoji === emoji
                    ? 'border-indigo-400 shadow-md ring-2 ring-indigo-400 ring-offset-1 scale-110'
                    : 'border-slate-200 hover:scale-105 hover:shadow-sm'
                }`}''',
    '''className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer border ${
                  avatarEmoji === emoji
                    ? 'border-indigo-400 shadow-md ring-2 ring-indigo-400 ring-offset-1 scale-110'
                    : (isGlassTheme(currentTheme) ? 'bg-white/20 border-white/20 hover:bg-white/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:scale-105 hover:shadow-sm')
                }`}'''
)

with open(filepath, 'w') as f:
    f.write(content)
