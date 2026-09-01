import os

filepath = 'src/components/Header.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target = """            {/* Theme Switcher Dropdown */}"""
replacement = """            {/* Mobile UI Toggle (Desktop Only) */}
            <button
              onClick={() => {
                soundFX.playPop();
                if (onToggleMobileUi) onToggleMobileUi();
              }}
              className={`hidden md:inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm hover:bg-white border-white/20'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
              title={forceMobileUi ? "Switch to Desktop UI" : "Switch to Mobile UI"}
            >
              {forceMobileUi ? (
                <Monitor className="w-4 h-4 text-sky-500" />
              ) : (
                <Smartphone className="w-4 h-4 text-emerald-500" />
              )}
            </button>

            {/* Theme Switcher Dropdown */}"""

content = content.replace(target, replacement)

with open(filepath, 'w') as f:
    f.write(content)
