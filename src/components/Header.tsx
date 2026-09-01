import React, { useState } from 'react';
import { 
  Sparkles, 
  Printer, 
  Plus, 
  SlidersHorizontal,
  Home,
  Volume2,
  VolumeX,
  Globe,
  Palette,
  Calendar,
  Camera,
  Image as ImageIcon,
  Lock,
  Unlock,
  Shield,
  Cloud,
  CloudCheck,
  Smartphone,
  Monitor
} from 'lucide-react';
import { HouseholdMember, HouseholdInfo } from '../types';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { Avatar } from './Avatar';

interface HeaderProps {
  members: HouseholdMember[];
  householdInfo: HouseholdInfo;
  onOpenHouseSettings: () => void;
  onOpenCloudSync?: () => void;
  onOpenQuickSettings?: () => void;
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  pendingInspectionCount: number;
  onOpenNewChore: () => void;
  onOpenInspectionQueue: () => void;
  onOpenPrintView: () => void;
  onOpenAIAssign: () => void;
  onOpenGoogleCalendar: () => void;
  onResetDemo?: () => void;
  isMomMode: boolean;
  forceMobileUi?: boolean;
  onToggleMobileUi?: () => void;
  onToggleMomMode: () => void;
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  currentTheme: ThemePreset;
  onSelectTheme: (theme: ThemePreset) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  members,
  householdInfo,
  onOpenHouseSettings,
  onOpenCloudSync,
  onOpenQuickSettings,
  selectedMemberId,
  onSelectMember,
  pendingInspectionCount,
  onOpenNewChore,
  onOpenInspectionQueue,
  onOpenPrintView,
  onOpenAIAssign,
  onOpenGoogleCalendar,
  onResetDemo,
  isMomMode,
  forceMobileUi,
  onToggleMobileUi,
  onToggleMomMode,
  language,
  onSelectLanguage,
  currentTheme,
  onSelectTheme,
  isSoundEnabled,
  onToggleSound,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;

  return (
    <header className={`${theme.headerBg} border-b ${theme.headerBorder} sticky top-0 z-30 shadow-xs no-print transition-colors duration-200 w-full`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Mobile Compact Header (Single Row on small screens) */}
        <div className="lg:hidden flex items-center justify-between py-2 gap-2">
          {/* Brand & House Avatar */}
          <div className="flex items-center space-x-2 min-w-0">
            <button
              onClick={() => {
                soundFX.playPop();
                onOpenHouseSettings();
              }}
              className="relative group shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-xl active:scale-95 transition-transform"
              title="Click to view/change house picture and settings"
            >
              {householdInfo.housePhotoUrl ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-slate-200 shadow-2xs">
                  <img
                    src={householdInfo.housePhotoUrl}
                    alt={householdInfo.familyName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} flex items-center justify-center text-white shadow-2xs font-bold text-base`}>
                  🏡
                </div>
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
                  {householdInfo.familyName || t.appTitle}
                </h1>
                {householdInfo.isCloudSynced && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Cloud Synced" />
                )}
              </div>
              <p className="text-[10px] text-white/80 truncate max-w-[170px]">
                {householdInfo.houseAddressOrMotto || t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Mobile Right Controls: Print Fridge, Mom/Kid Badge + Quick Menu Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Print Fridge Schedule Quick Button */}
            <button
              id="mobile-print-schedule-btn"
              onClick={() => {
                soundFX.playPop();
                onOpenPrintView();
              }}
              className={`p-2 rounded-xl border transition-colors active:scale-95 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-rose-200 border-white/20 shadow-2xs'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-200'
              }`}
              title="Printable Fridge Charts & Punchcards"
            >
              <Printer className="w-4 h-4 text-rose-600" />
            </button>

            {/* Mom/Kid Mode Toggle */}
            <button
              id="mobile-mom-mode-toggle"
              onClick={() => {
                soundFX.playPop();
                onToggleMomMode();
              }}
              className={`text-[11px] px-2.5 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1 border active:scale-95 cursor-pointer min-h-[38px] ${
                isMomMode 
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill border-white/40 shadow-2xs'
                    : `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} shadow-2xs` 
                  : isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm border-white/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isMomMode ? 'Tap to Lock Mom Mode (Switch to Kid View)' : 'Tap to Enter Mom / Admin Mode (PIN Required)'}
            >
              {isMomMode ? (
                <Unlock className={`w-3.5 h-3.5 ${isGlassTheme(currentTheme) ? 'text-rose-700' : 'text-rose-600'}`} />
              ) : (
                <Lock className="w-3.5 h-3.5 text-white/80" />
              )}
              <span>{isMomMode ? 'Mom' : 'Kid'}</span>
            </button>

            {/* Quick Tools & Family Cloud Settings Modal Trigger */}
            <button
              id="mobile-quick-settings-btn"
              onClick={() => {
                soundFX.playPop();
                if (onOpenQuickSettings) onOpenQuickSettings();
              }}
              className={`relative p-2 rounded-xl transition-all active:scale-95 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border ${
                !householdInfo.isCloudSynced 
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-sky-100/80 text-sky-900 border-sky-300 shadow-2xs'
                    : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700 shadow-2xs' 
                  : isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm border-white/20'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title={householdInfo.isCloudSynced ? "Household Hub & Settings" : "Set Up Family Cloud Sync & Settings"}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {!householdInfo.isCloudSynced && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500 border border-white"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Header Row (Hidden on mobile) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between py-2.5 sm:py-3 gap-3 w-full">
          
          {/* Brand, House Photo/Icon, Title & Motto */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* House Photo Avatar or Default Home Emoji Icon */}
            <button
              onClick={() => {
                soundFX.playPop();
                onOpenHouseSettings();
              }}
              className="relative group shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-2xl cursor-pointer"
              title="Click to view/change house picture and settings"
            >
              {householdInfo.housePhotoUrl ? (
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border-2 ${isGlassTheme(currentTheme) ? 'border-white/20 shadow-md' : 'border-slate-200 shadow-2xs'} group-hover:border-rose-400 transition-colors`}>
                  <img
                    src={householdInfo.housePhotoUrl}
                    alt={householdInfo.familyName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${isGlassTheme(currentTheme) ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-slate-900 border-white/20 shadow-md' : `${theme.primaryBg} text-white shadow-2xs`} flex items-center justify-center font-bold text-lg sm:text-xl transition-transform group-hover:scale-105`}>
                  🏡
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-300 text-[10px] text-slate-700 flex items-center justify-center shadow-2xs">
                📷
              </span>
            </button>

            <div className="shrink-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                  {householdInfo.familyName || t.appTitle}
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-white border-white/20 shadow-2xs'
                    : `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                } whitespace-nowrap`}>
                  {t.momsCommand}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/80 whitespace-nowrap max-w-[220px] 2xl:max-w-xs truncate">
                {householdInfo.houseAddressOrMotto || t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Action Tools & Customization Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end flex-nowrap">
            
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm hover:bg-white border-white/20'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title="Select Language (English / Tagalog / Ilokano)"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flagEmoji}</span>
                <span className="hidden xl:inline font-semibold">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-1.5 z-50 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Piliin ang Wika / Pagsasao
                  </div>
                  {SUPPORTED_LANGUAGES.map((langOpt) => (
                    <button
                      key={langOpt.code}
                      onClick={() => {
                        soundFX.playPop();
                        onSelectLanguage(langOpt.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                        language === langOpt.code 
                          ? 'bg-slate-900 text-white font-bold' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{langOpt.flagEmoji}</span>
                        <div>
                          <div className="font-semibold">{langOpt.name}</div>
                          <div className="text-[10px] opacity-75">{langOpt.nativeName}</div>
                        </div>
                      </div>
                      {language === langOpt.code && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile UI Toggle (Desktop Only) */}
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

            {/* Theme Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm hover:bg-white border-white/20'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title="Change Color Theme & Canvas Ambiance"
              >
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm leading-none">{theme.emoji}</span>
                <span className="hidden xl:inline text-[11px] font-semibold text-slate-600">{theme.name.split(' ')[0]}</span>
              </button>

              {showThemeMenu && (
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
              )}
            </div>

            {/* Cloud Sync Button (Firebase Multi-Family) */}
            <button
              onClick={() => {
                soundFX.playPop();
                if (onOpenCloudSync) onOpenCloudSync();
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                householdInfo.isCloudSynced
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-emerald-500/20 text-emerald-900 border-emerald-300/80 shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white drop-shadow-sm hover:bg-white border-white/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title={householdInfo.isCloudSynced ? `Cloud Synced (${householdInfo.householdCode || 'Live'})` : 'Connect Multi-Family Cloud Sync'}
            >
              {householdInfo.isCloudSynced ? (
                <>
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono text-[11px] font-black text-emerald-700 hidden 2xl:inline">
                    {householdInfo.householdCode || 'SYNCED'}
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                  <span className="hidden 2xl:inline text-[11px]">Sync</span>
                </>
              )}
            </button>

            {/* Sound FX Toggle */}
            <button
              onClick={() => {
                onToggleSound();
                if (!isSoundEnabled) {
                  soundFX.playPop();
                }
              }}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isSoundEnabled
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-amber-500/20 text-amber-900 border-amber-300/80'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-white/5 dark:bg-black/10 text-white/80 border-white/20'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
              title={isSoundEnabled ? t.soundOn : t.soundMuted}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Mom Inspection Alert Pill (Mom Mode Only) */}
            {isMomMode && pendingInspectionCount > 0 && (
              <button
                id="header-inspection-badge-btn"
                onClick={() => {
                  soundFX.playPop();
                  onOpenInspectionQueue();
                }}
                className={`relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-button-primary text-white drop-shadow-sm'
                    : 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                } transition-all animate-pulse cursor-pointer whitespace-nowrap`}
                title={`${pendingInspectionCount} chores waiting for inspection`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pendingInspectionCount} {t.toInspect}</span>
              </button>
            )}

            {/* Add New Chore Button (Mom Mode Only) */}
            {isMomMode && (
              <button
                id="header-add-chore-btn"
                onClick={() => {
                  soundFX.playPop();
                  onOpenNewChore();
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-bold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-button-primary'
                    : `${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover}`
                } transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap`}
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{t.newChore}</span>
              </button>
            )}

            {/* Mom Mode Switcher for Desktop */}
            <div className={`flex items-center ${isGlassTheme(currentTheme) ? 'apple-glass-pill bg-white/5 dark:bg-black/10 border-white/20' : 'bg-slate-100 border-slate-200'} p-0.5 rounded-xl border shrink-0`}>
              <button
                id="desktop-mom-mode-btn"
                onClick={() => {
                  soundFX.playPop();
                  if (!isMomMode) onToggleMomMode();
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isMomMode 
                    ? isGlassTheme(currentTheme)
                      ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-rose-100 shadow-xs font-black border-white/20'
                      : `bg-white ${theme.badgeText} shadow-xs` 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isMomMode ? 'Mom Mode Active (Admin Unlocked)' : 'Switch to Mom Admin Mode (Requires PIN)'}
              >
                {isMomMode ? <Unlock className="w-3 h-3 text-rose-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                <span>{t.momAdmin}</span>
              </button>
              <button
                id="desktop-family-mode-btn"
                onClick={() => {
                  soundFX.playPop();
                  if (isMomMode) onToggleMomMode();
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  !isMomMode 
                    ? isGlassTheme(currentTheme)
                      ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-white drop-shadow-sm shadow-xs font-black border-white/20'
                      : 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Kid / Helper View (Locks Mom Mode)"
              >
                <span>{t.kidChecklist}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
