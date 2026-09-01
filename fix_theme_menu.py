import os

filepath = 'src/components/Header.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  <div className={`absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border ${isGlassTheme(currentTheme) ? 'bg-white/20 backdrop-blur-3xl border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <div className={`px-2.5 py-1.5 flex items-center justify-between border-b mb-1 ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-100 dark:border-slate-800'}`}>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500 dark:text-slate-400'}`}>
                        <Palette className="w-3 h-3 text-amber-500" />
                        Themes & Glass Shaders
                      </span>
                      <span className={`text-[10px] font-semibold ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-400 dark:text-slate-500'}`}>
                        {Object.keys(THEMES).length} Presets
                      </span>
                    </div>

                    {(Object.keys(THEMES) as ThemePreset[]).map((tKey) => {
                      const th = THEMES[tKey];
                      const isSelected = currentTheme === tKey;
                      const isGlass = tKey === 'frosted_glass' || tKey === 'crystal_ice';
                      return (
                        <button
                          key={tKey}
                          onClick={() => {
                            soundFX.playPop();
                            onSelectTheme(tKey);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                            isSelected 
                              ? (isGlassTheme(currentTheme) ? 'bg-white/40 shadow-sm border border-white/30' : 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs font-bold') 
                              : (isGlassTheme(currentTheme) ? 'hover:bg-white/20 border border-transparent' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent')
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">{th.emoji}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold truncate ${isSelected ? (isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-white') : (isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-slate-100')}`}>
                                  {th.name}
                                </span>
                                {isGlass && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${isSelected ? (isGlassTheme(currentTheme) ? 'bg-sky-400 text-white' : 'bg-sky-400 text-white') : (isGlassTheme(currentTheme) ? 'bg-white/50 text-sky-900 border border-white/40' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300')}`}>
                                    Shader
                                  </span>
                                )}
                                {th.isDark && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${isSelected ? (isGlassTheme(currentTheme) ? 'bg-cyan-400 text-white' : 'bg-cyan-400 text-white') : (isGlassTheme(currentTheme) ? 'bg-slate-800/80 text-cyan-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}`}>
                                    Dark
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] truncate ${isSelected ? (isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-300 dark:text-slate-400') : (isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400')}`}>
                                {th.tagline}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`w-3 h-3 rounded-full ${th.primaryBg} border border-white/50 shadow-2xs`} />
                            {isSelected && <span className={`text-sm font-black ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-emerald-400'}`}>✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}"""

new_block = """              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  <div className={`absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.15)] p-2 z-50 space-y-1 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border ${isGlassTheme(currentTheme) ? 'bg-white/85 backdrop-blur-2xl border-white/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <div className={`px-2.5 py-1.5 flex items-center justify-between border-b mb-1 ${isGlassTheme(currentTheme) ? 'border-slate-200/50' : 'border-slate-100 dark:border-slate-800'}`}>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                        <Palette className="w-3 h-3 text-amber-500" />
                        Themes & Glass Shaders
                      </span>
                      <span className={`text-[10px] font-semibold ${isGlassTheme(currentTheme) ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {Object.keys(THEMES).length} Presets
                      </span>
                    </div>

                    {(Object.keys(THEMES) as ThemePreset[]).map((tKey) => {
                      const th = THEMES[tKey];
                      const isSelected = currentTheme === tKey;
                      const isGlass = tKey === 'frosted_glass' || tKey === 'crystal_ice';
                      return (
                        <button
                          key={tKey}
                          onClick={() => {
                            soundFX.playPop();
                            onSelectTheme(tKey);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                            isSelected 
                              ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs font-bold' 
                              : (isGlassTheme(currentTheme) ? 'hover:bg-white/60 border border-transparent text-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent')
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">{th.emoji}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold truncate ${isSelected ? 'text-white' : (isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-slate-100')}`}>
                                  {th.name}
                                </span>
                                {isGlass && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${isSelected ? 'bg-sky-400 text-white' : (isGlassTheme(currentTheme) ? 'bg-white/50 text-sky-900 border border-white/40' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300')}`}>
                                    Shader
                                  </span>
                                )}
                                {th.isDark && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${isSelected ? 'bg-cyan-400 text-white' : (isGlassTheme(currentTheme) ? 'bg-slate-800/80 text-cyan-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}`}>
                                    Dark
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300 dark:text-slate-400' : (isGlassTheme(currentTheme) ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400')}`}>
                                {th.tagline}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`w-3 h-3 rounded-full ${th.primaryBg} border border-white/50 shadow-2xs`} />
                            {isSelected && <span className="text-emerald-400 text-sm font-black">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}"""

content = content.replace(old_block, new_block)
with open(filepath, 'w') as f:
    f.write(content)

