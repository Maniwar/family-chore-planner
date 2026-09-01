import os

filepath = 'src/components/Header.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Container background
content = content.replace(
    'className="absolute right-0 mt-2 w-64 sm:w-72 bg-white/10 dark:bg-black/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-2 z-50 space-y-1 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"',
    'className={`absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border ${isGlassTheme(currentTheme) ? \'bg-white/20 backdrop-blur-3xl border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]\' : \'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800\'}`}'
)

# Header
content = content.replace(
    'className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-200/60 mb-1"',
    'className={`px-2.5 py-1.5 flex items-center justify-between border-b mb-1 ${isGlassTheme(currentTheme) ? \'border-white/20\' : \'border-slate-100 dark:border-slate-800\'}`}'
)

content = content.replace(
    'className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider flex items-center gap-1"',
    'className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isGlassTheme(currentTheme) ? \'text-slate-800\' : \'text-slate-500 dark:text-slate-400\'}`}'
)

content = content.replace(
    'className="text-[10px] text-white/80 font-semibold"',
    'className={`text-[10px] font-semibold ${isGlassTheme(currentTheme) ? \'text-slate-700\' : \'text-slate-400 dark:text-slate-500\'}`}'
)

# Row buttons
content = content.replace(
    '''className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                            isSelected 
                              ? 'bg-slate-900 text-white shadow-xs font-bold' 
                              : isGlass
                              ? 'text-white drop-shadow-sm bg-sky-50/40 hover:bg-sky-100/50 border border-sky-200/40 font-medium'
                              : 'text-slate-700 hover:bg-slate-100/80'
                          }`}''',
    '''className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                            isSelected 
                              ? (isGlassTheme(currentTheme) ? 'bg-white/40 shadow-sm border border-white/30' : 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs font-bold') 
                              : (isGlassTheme(currentTheme) ? 'hover:bg-white/20 border border-transparent' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent')
                          }`}'''
)

# Names and Tags
content = content.replace(
    'className={`font-bold truncate ${isSelected ? \'text-white\' : \'text-slate-900\'}`}',
    'className={`font-bold truncate ${isSelected ? (isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-white\') : (isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-slate-900 dark:text-slate-100\')}`}'
)

content = content.replace(
    'className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${isSelected ? \'bg-sky-400 text-white drop-shadow-sm\' : \'bg-sky-200/70 text-sky-900\'}`}',
    'className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${isSelected ? (isGlassTheme(currentTheme) ? \'bg-sky-400 text-white\' : \'bg-sky-400 text-white\') : (isGlassTheme(currentTheme) ? \'bg-white/50 text-sky-900 border border-white/40\' : \'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300\')}`}'
)

content = content.replace(
    'className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${isSelected ? \'bg-cyan-400 text-white drop-shadow-sm\' : \'bg-slate-800 text-cyan-300\'}`}',
    'className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${isSelected ? (isGlassTheme(currentTheme) ? \'bg-cyan-400 text-white\' : \'bg-cyan-400 text-white\') : (isGlassTheme(currentTheme) ? \'bg-slate-800/80 text-cyan-300\' : \'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400\')}`}'
)

content = content.replace(
    'className={`text-[10px] truncate ${isSelected ? \'text-slate-300\' : \'text-white/80\'}`}',
    'className={`text-[10px] truncate ${isSelected ? (isGlassTheme(currentTheme) ? \'text-slate-700\' : \'text-slate-300 dark:text-slate-400\') : (isGlassTheme(currentTheme) ? \'text-slate-600\' : \'text-slate-500 dark:text-slate-400\')}`}'
)

# Checkmark
content = content.replace(
    '{isSelected && <span className="text-emerald-400 text-sm font-black">✓</span>}',
    '{isSelected && <span className={`text-sm font-black ${isGlassTheme(currentTheme) ? \'text-slate-900\' : \'text-emerald-400\'}`}>✓</span>}'
)


with open(filepath, 'w') as f:
    f.write(content)

