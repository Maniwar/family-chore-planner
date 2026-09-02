import re

with open('src/components/RedemptionsManagerView.tsx', 'r') as f:
    content = f.read()

# Make sure BottomSheetGrabber is imported
if 'BottomSheetGrabber' not in content:
    content = content.replace("import { Avatar }", "import { Avatar }\nimport { BottomSheetGrabber }")

# Replace the modal wrapper
content = re.sub(
    r'<div className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom duration-200 z-10 max-h-\[90vh\] overflow-y-auto safe-area-pb">',
    r'<div className={`relative rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border space-y-4 animate-in slide-in-from-bottom duration-200 z-10 max-h-[90vh] overflow-y-auto safe-area-pb ${isGlassTheme(currentTheme) ? \'apple-glass-panel border-white/30\' : \'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800\'}`}>',
    content
)

# Replace the drag handle
content = re.sub(
    r'\{/\* iOS Drag Handle \*/\}.*?</button>',
    r'''<div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 bg-white/10 dark:bg-black/10 rounded-t-3xl -mx-4 -mt-4 sm:mx-0 sm:mt-0 sm:bg-transparent sm:border-b-0 sm:pb-0 sm:hidden">
              <BottomSheetGrabber onClose={() => setNoteModalClaim(null)} variant={isGlassTheme(currentTheme) ? 'white' : 'default'} />
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className={`text-base font-black ${isGlassTheme(currentTheme) ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                  {noteActionType === 'approve' 
                    ? 'Approve Reward Claim' 
                    : noteActionType === 'deliver' 
                    ? 'Confirm Reward Delivery'
                    : 'Reject Reward Claim'}
                </h3>
              </div>
              <button 
                onClick={() => setNoteModalClaim(null)}
                className={`p-1.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-700 hover:bg-white/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <X className="w-5 h-5" />
              </button>''',
    content, flags=re.DOTALL
)

# Replace the input textarea
content = re.sub(
    r'<textarea\s+placeholder="e\.g\. We can do this tomorrow after school"\s+value=\{noteText\}\s+onChange=\{\(e\) => setNoteText\(e\.target\.value\)\}\s+rows=\{3\}\s+className=\{`w-full text-xs p-2\.5 rounded-xl border font-medium focus:ring-2 transition-all \$\{isGlassTheme\(currentTheme\) \? \'[^\']+\' : \'[^\']+\'\}\`\}\s+/>',
    r'''<textarea
                placeholder="e.g. We can do this tomorrow after school"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                className={`w-full text-xs p-2.5 rounded-xl border font-medium focus:ring-2 transition-all ${isGlassTheme(currentTheme) ? 'apple-glass-input focus:ring-slate-500/50' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-' + (noteActionType === 'reject' ? 'rose-500' : noteActionType === 'approve' ? 'emerald-500' : 'indigo-500')}`}
              />''',
    content
)


with open('src/components/RedemptionsManagerView.tsx', 'w') as f:
    f.write(content)

