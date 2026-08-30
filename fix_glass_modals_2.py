import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)


# HouseSettingsModal.tsx
replacements_house = [
    # Replace solid white inputs with glass versions when isGlass
    (r"className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/20 focus:bg-white/60 text-slate-900' : theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}",
     r"className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}"),
    
    (r"className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/20 focus:bg-white/60 text-slate-900' : theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}",
     r"className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 focus:bg-white/20 text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}"),
    
    # Fix the card backgrounds themselves in HouseSettingsModal
    (r"className={`p-4 rounded-3xl border space-y-4 ${isGlassTheme(currentTheme) ? 'bg-white/30 backdrop-blur-xl border-white/40 shadow-[0_4px_16px_rgba(31,38,135,0.05)]' : theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}",
     r"className={`p-4 rounded-3xl border space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}"),
    
    (r"className={`p-4 rounded-3xl border shadow-xs flex items-center justify-between gap-4 ${isGlassTheme(currentTheme) ? 'bg-white/40 backdrop-blur-xl border-white/50 shadow-[inset_1px_1.5px_0_rgba(255,255,255,1),0_4px_16px_rgba(31,38,135,0.08)]' : theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}",
     r"className={`p-4 rounded-3xl border shadow-xs flex items-center justify-between gap-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}"),
     
    (r"className={`p-4 rounded-3xl border shadow-xs space-y-3 ${isGlassTheme(currentTheme) ? 'bg-white/20 backdrop-blur-xl border-white/30' : theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}",
     r"className={`p-4 rounded-3xl border shadow-xs space-y-3 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}")
]

if os.path.exists('src/components/HouseSettingsModal.tsx'):
    replace_in_file('src/components/HouseSettingsModal.tsx', replacements_house)

# HouseholdSyncModal.tsx
replacements_sync = [
    # Join code box
    (r"className={`p-3 bg-white rounded-xl border border-slate-200 text-slate-900 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95`}",
     r"className={`p-3 rounded-xl border flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 ${isGlassTheme(currentTheme) ? 'bg-white/20 backdrop-blur-lg border-white/30 text-slate-900' : 'bg-white border-slate-200 text-slate-900'}`}"),
     
    # Password box inside join modal
    (r"className=\"w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900\"",
     r"className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${isGlassTheme(currentTheme) ? 'bg-white/30 backdrop-blur-lg border-white/40 text-slate-900 placeholder:text-slate-600' : 'bg-white border-amber-300 text-slate-900'}`}"),
     
    # Disconnect buttons, etc. need checking, but let's fix the solid blocks
    (r"className={`px-4 pt-2.5 sm:px-5 shrink-0 ${isGlassTheme(currentTheme) ? 'bg-transparent' : theme.isDark ? 'bg-slate-900' : 'bg-white'}`}",
     r"className={`px-4 pt-2.5 sm:px-5 shrink-0 ${isGlassTheme(currentTheme) ? 'bg-transparent' : theme.isDark ? 'bg-slate-900' : 'bg-white'}`}"),
     
    # Tab background in HouseholdSyncModal
    (r"className={`p-1 rounded-xl flex gap-1 border ${theme.isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-100/90 border-slate-200/60'}`}",
     r"className={`p-1 rounded-xl flex gap-1 border ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 backdrop-blur-sm' : theme.isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-100/90 border-slate-200/60'}`}"),

    # Active tab in HouseholdSyncModal
    (r"tab === 'status' \n                  ? (theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')",
     r"tab === 'status' ? (isGlassTheme(currentTheme) ? 'bg-white/80 text-slate-900 shadow-sm font-extrabold' : theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')"),
    (r"tab === 'join' \n                  ? (theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')",
     r"tab === 'join' ? (isGlassTheme(currentTheme) ? 'bg-white/80 text-slate-900 shadow-sm font-extrabold' : theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')"),
    (r"tab === 'create' \n                  ? (theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')",
     r"tab === 'create' ? (isGlassTheme(currentTheme) ? 'bg-white/80 text-slate-900 shadow-sm font-extrabold' : theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')"),
     
    # Inactive tabs
    (r"(theme.isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')",
     r"(isGlassTheme(currentTheme) ? 'text-slate-700 hover:text-slate-900' : theme.isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')")
]

if os.path.exists('src/components/HouseholdSyncModal.tsx'):
    replace_in_file('src/components/HouseholdSyncModal.tsx', replacements_sync)
    
