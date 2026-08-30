import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

replacements_inspection = [
    # Verify Quality Criteria Checklist container
    (r"isGlass \n                  ? 'bg-white/10 backdrop-blur-xl border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]' \n                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'",
     r"isGlass ? 'apple-glass-card border-white/30' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'"),
     
    # Quality Grade & Star Rating container
    (r"isGlass \n                ? 'bg-white/40 backdrop-blur-xl border-white/20 shadow-[inset_1px_1.5px_0_rgba(255,255,255,0.95),0_4px_16px_rgba(31,38,135,0.06)]' \n                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'",
     r"isGlass ? 'apple-glass-card border-white/30' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'"),

    # Checklist items unchecked state
    (r"isGlass\n                          ? 'bg-white/20 text-slate-900 hover:bg-white/30 border border-white/20 backdrop-blur-xl shadow-[inset_1px_1.5px_0_rgba(255,255,255,0.95),inset_-1px_-1px_0_rgba(255,255,255,0.25),0_4px_14px_rgba(31,38,135,0.06)]'",
     r"isGlass ? 'bg-white/10 text-slate-900 hover:bg-white/20 border border-white/30 backdrop-blur-md shadow-[inset_1px_1.5px_0_rgba(255,255,255,0.4)]'"),
     
    # Sticky footer
    (r"isGlass \n            ? 'border-white/70 bg-white/35 backdrop-blur-2xl' \n            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'",
     r"isGlass ? 'border-white/30 bg-white/10 backdrop-blur-3xl shadow-[0_-4px_16px_rgba(0,0,0,0.05)]' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'"),
     
    # Approve Button - apple-glass-button-primary is ok, it looks white because of the wrapper. 
    # Let's also check Request Touch-up (Redo) button
    (r"isGlass\n                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 border border-rose-300/80 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8)] backdrop-blur-xl'",
     r"isGlass ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-950 border border-rose-400/50 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.6)] backdrop-blur-xl'"),
     
    # Feedback note input
    (r"isGlass \n                  ? 'bg-white/55 backdrop-blur-xl border-white/20 text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]' \n                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'",
     r"isGlass ? 'bg-white/20 backdrop-blur-md border-white/30 text-slate-900 placeholder:text-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'")
]

if os.path.exists('src/components/InspectionModal.tsx'):
    replace_in_file('src/components/InspectionModal.tsx', replacements_inspection)

