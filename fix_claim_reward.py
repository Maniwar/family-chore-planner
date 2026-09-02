import re

with open('src/components/RewardsView.tsx', 'r') as f:
    content = f.read()

# Replace the drag handle with BottomSheetGrabber
content = re.sub(
    r'\{/\* Top Drag Handle for Mobile \*/\}.*?</button>',
    r'''<div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 bg-white/10 dark:bg-black/10 rounded-t-3xl -mx-4 -mt-4 sm:mx-0 sm:mt-0 sm:bg-transparent sm:border-b-0 sm:pb-0 sm:hidden">
              <BottomSheetGrabber onClose={() => setClaimModalReward(null)} variant={isGlassTheme(currentTheme) ? 'white' : 'default'} />
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Claim Reward</h3>
                <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'} font-medium`}>Request redemption from family store</p>
              </div>
              <button 
                onClick={() => setClaimModalReward(null)} 
                className={`p-1.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-700 hover:bg-white/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <X className="w-5 h-5" />
              </button>''',
    content, flags=re.DOTALL
)

# Replace the amber box
content = re.sub(
    r'<div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">',
    r'<div className={`p-3 rounded-2xl border text-center ${isGlassTheme(currentTheme) ? \'apple-glass-card border-amber-300/40\' : \'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800\'}`}>',
    content
)

# Replace the selected option logic
content = re.sub(
    r'!\s*hasEnough\s*\?\s*\'[^\']+\'\s*:\s*isSelected\s*\?\s*\'[^\']+\'\s*:\s*\(isGlassTheme[^\)]+\)\s*\?\s*\'[^\']+\'\s*:\s*\'[^\']+\'\)',
    r'''!hasEnough 
                          ? (isGlassTheme(currentTheme) ? 'opacity-50 apple-glass-input cursor-not-allowed' : 'opacity-50 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed')
                          : isSelected
                            ? (isGlassTheme(currentTheme) ? 'apple-glass-card border-amber-400/60 ring-2 ring-amber-400/20 bg-amber-500/10' : 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20')
                            : (isGlassTheme(currentTheme) ? 'apple-glass-card border-white/40 text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750')''',
    content
)

# Replace the input
content = re.sub(
    r'<input\s+type="text"\s+placeholder="e\.g\. Can we do this on Friday night\?"\s+value=\{claimNote\}\s+onChange=\{\(e\) => setClaimNote\(e\.target\.value\)\}\s+className=\{`w-full text-xs p-2\.5 rounded-xl border font-medium focus:ring-2 focus:ring-rose-500 transition-all \$\{isGlassTheme\(currentTheme\) \? \'[^\']+\' : \'[^\']+\'\}\`\}\s+/>',
    r'''<input
                type="text"
                placeholder="e.g. Can we do this on Friday night?"
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl border font-medium focus:ring-2 focus:ring-rose-500 transition-all ${isGlassTheme(currentTheme) ? 'apple-glass-input' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'}`}
              />''',
    content
)

with open('src/components/RewardsView.tsx', 'w') as f:
    f.write(content)

