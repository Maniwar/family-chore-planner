const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

// 1. Add onLogOffProfile to HeaderProps
code = code.replace(
  '  onToggleSound: () => void;\n}',
  '  onToggleSound: () => void;\n  onLogOffProfile?: () => void;\n}'
);

code = code.replace(
  '  isSoundEnabled,\n  onToggleSound,\n}) => {',
  '  isSoundEnabled,\n  onToggleSound,\n  onLogOffProfile,\n}) => {'
);

// 2. Add Mobile Log Off Button
const mobileMomModeToggleRegex = /\{\/\* Mom\/Kid Mode Toggle \*\/\}/;
const mobileLogOffButton = `{/* Mobile Log Off Profile Button */}
            {!isMomMode && selectedMemberId !== 'all' && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  if (onLogOffProfile) onLogOffProfile();
                }}
                className={\`text-[11px] px-2 py-1 rounded-xl font-extrabold transition-all flex items-center gap-1 border active:scale-95 cursor-pointer min-h-[34px] \${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm border-white/20'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }\`}
                title="Lock this profile and return to family view"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Lock</span>
              </button>
            )}
            {/* Mom/Kid Mode Toggle */}`;

code = code.replace(mobileMomModeToggleRegex, mobileLogOffButton);

// 3. Add Desktop Log Off Button
const desktopMomModeRegex = /\{\/\* Mom Mode Switcher for Desktop \*\/\}/;
const desktopLogOffButton = `{/* Log Off Profile Switcher for Desktop */}
            {!isMomMode && selectedMemberId !== 'all' && (
              <div className={\`flex items-center \${isGlassTheme(currentTheme) ? 'apple-glass-pill bg-white/5 dark:bg-black/10 border-white/20' : 'bg-slate-100 border-slate-200'} p-0.5 rounded-xl border shrink-0 mr-1\`}>
                <button
                  onClick={() => {
                    soundFX.playPop();
                    if (onLogOffProfile) onLogOffProfile();
                  }}
                  className={\`px-2 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap text-slate-600 hover:text-slate-900\`}
                  title="Lock this profile and return to family view"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="hidden xl:inline">Lock Profile</span>
                  <span className="xl:hidden">Lock</span>
                </button>
              </div>
            )}
            {/* Mom Mode Switcher for Desktop */}`;

code = code.replace(desktopMomModeRegex, desktopLogOffButton);

fs.writeFileSync('src/components/Header.tsx', code);
