import re
import os

filepath = 'src/components/GoogleCalendarView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Header Banner
old_banner = r"className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/40 text-slate-900' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white'}`}"
new_banner = r"className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20 text-slate-900' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white'}`}"
content = content.replace(old_banner, new_banner)

old_status_box = r"className={`${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40 shadow-xs' : 'bg-white/10 backdrop-blur-md border-white/20'} border border-white/20 rounded-2xl p-4 min-w-[260px]`}"
new_status_box = r"className={`${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] text-slate-900' : 'bg-white/10 backdrop-blur-md border-white/20 text-white'} border border-white/20 rounded-2xl p-4 min-w-[260px]`}"
content = content.replace(old_status_box, new_status_box)

old_status_text = r"className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-300'} font-medium mb-1`}"
new_status_text = r"className={`text-xs font-medium mb-1 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-300'}`}"
content = content.replace(old_status_text, new_status_text)

old_name = r"className=\"text-xs font-bold text-white truncate\""
new_name = r"className={`text-xs font-bold truncate ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-white'}`}"
content = content.replace(old_name, new_name)

old_email = r"className=\"text-[11px] text-emerald-300 truncate\""
new_email = r"className={`text-[11px] truncate ${isGlassTheme(currentTheme) ? 'text-emerald-700 font-medium' : 'text-emerald-300'}`}"
content = content.replace(old_email, new_email)

old_btn_refresh = r"className=\"text-[11px] font-semibold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer\""
new_btn_refresh = r"className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${isGlassTheme(currentTheme) ? 'bg-white/40 hover:bg-white/60 text-slate-800 border border-white/20' : 'bg-white/20 hover:bg-white/30 text-white'}`}"
content = content.replace(old_btn_refresh, new_btn_refresh)

old_btn_disconnect = r"className=\"text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer\""
new_btn_disconnect = r"className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${isGlassTheme(currentTheme) ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 border border-rose-500/20' : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'}`}"
content = content.replace(old_btn_disconnect, new_btn_disconnect)

old_pulse = r"className=\"text-xs text-amber-300 font-medium flex items-center gap-1\""
new_pulse = r"className={`text-xs font-medium flex items-center gap-1 ${isGlassTheme(currentTheme) ? 'text-amber-600' : 'text-amber-300'}`}"
content = content.replace(old_pulse, new_pulse)

with open(filepath, 'w') as f:
    f.write(content)
