import re

with open('src/components/RedemptionsManagerView.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'className="px-4 py-2\.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-\[40px\] cursor-pointer"',
    r'className={`px-4 py-2.5 rounded-xl text-xs font-bold min-h-[40px] cursor-pointer ${isGlassTheme(currentTheme) ? \'apple-glass-button border-transparent hover:border-white/20 text-slate-900 dark:text-white\' : \'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800\'}`}',
    content
)

content = re.sub(
    r'className=\{`px-5 py-2\.5 rounded-xl text-xs font-black text-white shadow-2xs min-h-\[40px\] cursor-pointer active:scale-95 transition-all \$\{.*?\}\`\}',
    r'''className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-2xs min-h-[40px] cursor-pointer active:scale-95 transition-all ${
                  isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : (
                  noteActionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )
                }`}''',
    content, flags=re.DOTALL
)

with open('src/components/RedemptionsManagerView.tsx', 'w') as f:
    f.write(content)
