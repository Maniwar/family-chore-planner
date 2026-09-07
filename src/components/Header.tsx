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
  Monitor,
  Settings
} from 'lucide-react';
import { HouseholdMember, HouseholdInfo } from '../types';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { calculateHouseProgression } from '../utils/houseProgression';
import { Avatar } from './Avatar';

interface HeaderProps {
  members: HouseholdMember[];
  householdInfo: HouseholdInfo;
  onOpenHouseSettings: () => void;
  onOpenCloudSync?: () => void;
  onOpenQuickSettings?: () => void;
  onOpenHouseEvolution?: () => void;
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
  onOpenHouseEvolution,
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
  const houseProg = calculateHouseProgression(members, householdInfo);

  return (
    <header className={`${theme.headerBg} border-b ${theme.headerBorder} sticky top-0 z-30 shadow-xs no-print transition-colors duration-200 w-full`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Mobile Compact Header (Shown on mobile screens or when Mobile UI Preview is active) */}
        <div className={`${forceMobileUi ? 'flex' : 'flex lg:hidden'} items-center justify-between py-2 gap-2 w-full`}>
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
              <p className={`text-[10px] truncate max-w-[170px] ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-white/80'}`}>
                {householdInfo.houseAddressOrMotto || t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Mobile Right Controls: House Level, Mom/Kid Badge + Quick Menu Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* House Level Evolution Quick Button */}
            <button
              id="mobile-house-level-btn"
              onClick={() => {
                soundFX.playPop();
                if (onOpenHouseEvolution) onOpenHouseEvolution();
              }}
              className={`px-2 py-1 rounded-xl border transition-all active:scale-95 cursor-pointer min-h-[34px] flex items-center gap-1 shrink-0 ${
                isGlassTheme(currentTheme)
                  ? 'apple-glass-pill bg-amber-500/20 text-amber-950 dark:text-amber-200 border-amber-300/40 shadow-2xs'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
              }`}
              title={`House Level ${houseProg.currentLevel.level}: ${houseProg.currentLevel.title} (${houseProg.levelProgressPercent}% EXP)`}
            >
              <span className="text-sm leading-none">{houseProg.currentLevel.badgeEmoji}</span>
              <span className="text-[10px] font-black tracking-tight">Lv.{houseProg.currentLevel.level}</span>
              <span className="text-[8px] font-extrabold px-1 py-0.2 rounded-md bg-amber-500 text-white leading-none">
                {houseProg.levelProgressPercent}%
              </span>
            </button>

            {/* Mom/Kid Mode Toggle */}
            <button
              id="mobile-mom-mode-toggle"
              onClick={() => {
                soundFX.playPop();
                onToggleMomMode();
              }}
              className={`text-[11px] px-2 py-1 rounded-xl font-extrabold transition-all flex items-center gap-1 border active:scale-95 cursor-pointer min-h-[34px] ${
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
              className={`relative p-2 rounded-xl transition-all active:scale-95 cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center border ${
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

        {/* Desktop Header Row (Hidden on mobile or when Mobile UI Preview is forced) */}
        <div className={`${forceMobileUi ? 'hidden' : 'hidden lg:flex'} items-center justify-between py-2 sm:py-2.5 gap-2 xl:gap-3 w-full min-w-0`}>
          
          {/* Brand, House Photo/Icon, Title & Motto */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
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
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border-2 ${isGlassTheme(currentTheme) ? 'border-white/20 shadow-md' : 'border-slate-200 shadow-2xs'} group-hover:border-rose-400 transition-colors`}>
                  <img
                    src={householdInfo.housePhotoUrl}
                    alt={householdInfo.familyName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${isGlassTheme(currentTheme) ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-slate-900 border-white/20 shadow-md' : `${theme.primaryBg} text-white shadow-2xs`} flex items-center justify-center font-bold text-base sm:text-lg transition-transform group-hover:scale-105`}>
                  🏡
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border border-slate-300 text-[9px] text-slate-700 flex items-center justify-center shadow-2xs">
                📷
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate max-w-[160px] xl:max-w-none">
                  {householdInfo.familyName || t.appTitle}
                </h1>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-white border-white/20 shadow-2xs'
                    : `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                } whitespace-nowrap shrink-0`}>
                  {t.momsCommand}
                </span>

                {/* House Level Evolution Badge (Compact responsive display) */}
                <button
                  type="button"
                  id="desktop-house-level-badge"
                  onClick={() => {
                    soundFX.playPop();
                    if (onOpenHouseEvolution) onOpenHouseEvolution();
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black transition-all cursor-pointer active:scale-95 border group shrink-0 ${
                    isGlassTheme(currentTheme)
                      ? 'apple-glass-pill bg-amber-500/20 text-amber-950 dark:text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                      : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700 hover:bg-amber-200'
                  }`}
                  title={`House Level ${houseProg.currentLevel.level}: ${houseProg.currentLevel.title} (${houseProg.totalHouseXp} XP). Click to view House Evolution & Family XP!`}
                >
                  <span className="text-xs group-hover:scale-110 transition-transform leading-none">{houseProg.currentLevel.badgeEmoji}</span>
                  <span className="font-extrabold text-[10px] whitespace-nowrap">Lv.{houseProg.currentLevel.level}</span>
                  <span className="hidden 2xl:inline font-bold text-[10px] whitespace-nowrap">{houseProg.currentLevel.title}</span>
                  <span className="px-1 py-0.2 rounded-full text-[8px] bg-amber-500 text-white font-black leading-none">
                    {houseProg.levelProgressPercent}%
                  </span>
                </button>
              </div>
              <p className={`text-[10px] sm:text-[11px] whitespace-nowrap max-w-[180px] xl:max-w-xs truncate ${isGlassTheme(currentTheme) ? 'text-slate-600 dark:text-slate-300' : 'text-white/80'}`}>
                {householdInfo.houseAddressOrMotto || t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Action Tools & Customization Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end flex-nowrap">
            
            {/* Unified Utility Quick Controls Cluster */}
            <div className={`flex items-center p-0.5 rounded-xl border ${
              isGlassTheme(currentTheme)
                ? 'apple-glass-pill bg-white/5 dark:bg-black/10 border-white/20' 
                : 'bg-slate-100/90 border-slate-200'
            } shrink-0`}>
              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowThemeMenu(false);
                    setShowLangMenu(!showLangMenu);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    showLangMenu
                      ? (isGlassTheme(currentTheme) ? 'bg-white/20' : 'bg-white shadow-2xs text-slate-900')
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={`Language: ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English'}`}
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flagEmoji}</span>
                </button>

                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
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
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                            language === langOpt.code 
                              ? 'bg-slate-900 text-white font-bold' 
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                  </>
                )}
              </div>

              {/* Theme Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLangMenu(false);
                    setShowThemeMenu(!showThemeMenu);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    showThemeMenu
                      ? (isGlassTheme(currentTheme) ? 'bg-white/20' : 'bg-white shadow-2xs text-slate-900')
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={`Theme: ${theme.name}`}
                >
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs leading-none">{theme.emoji}</span>
                </button>

                {showThemeMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowThemeMenu(false)} 
                    />
                    <div className={`absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 border ${isGlassTheme(currentTheme) ? 'apple-glass-panel bg-white/20 border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
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
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                              isSelected 
                                ? (isGlassTheme(currentTheme) ? 'bg-white/50 shadow-sm border border-white/40' : 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs font-bold') 
                                : (isGlassTheme(currentTheme) ? 'hover:bg-white/30 border border-transparent' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent')
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
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase bg-sky-400 text-white">
                                      Shader
                                    </span>
                                  )}
                                  {th.isDark && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase bg-cyan-400 text-white">
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

              {/* Sound FX Toggle */}
              <button
                onClick={() => {
                  onToggleSound();
                  if (!isSoundEnabled) {
                    soundFX.playPop();
                  }
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isSoundEnabled
                    ? 'text-amber-700 dark:text-amber-300 hover:bg-amber-100/60'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
                }`}
                title={isSoundEnabled ? t.soundOn : t.soundMuted}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Cloud Sync Button */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  if (onOpenCloudSync) onOpenCloudSync();
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  householdInfo.isCloudSynced
                    ? 'text-emerald-700 hover:bg-emerald-100/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={householdInfo.isCloudSynced ? `Cloud Synced (${householdInfo.householdCode || 'Live'})` : 'Connect Multi-Family Cloud Sync'}
              >
                {householdInfo.isCloudSynced ? (
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  if (onOpenQuickSettings) onOpenQuickSettings();
                }}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Household Hub & Quick Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Desktop/Mobile Mode View Toggle */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  if (onToggleMobileUi) onToggleMobileUi();
                }}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title={forceMobileUi ? "Switch to Desktop UI" : "Switch to Mobile Preview UI"}
              >
                {forceMobileUi ? (
                  <Monitor className="w-3.5 h-3.5 text-sky-500" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            </div>

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
                } transition-all animate-pulse cursor-pointer whitespace-nowrap shrink-0`}
                title={`${pendingInspectionCount} chores waiting for inspection`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pendingInspectionCount}</span>
                <span className="hidden xl:inline">{t.toInspect}</span>
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
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-button-primary'
                    : `${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover}`
                } transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0`}
                title="Create a new chore assignment"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">{t.newChore}</span>
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
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isMomMode 
                    ? isGlassTheme(currentTheme)
                      ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-rose-100 shadow-xs font-black border-white/20'
                      : `bg-white ${theme.badgeText} shadow-xs` 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isMomMode ? 'Mom Mode Active (Admin Unlocked)' : 'Switch to Mom Admin Mode (Requires PIN)'}
              >
                {isMomMode ? <Unlock className="w-3 h-3 text-rose-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                <span className="hidden xl:inline">{t.momAdmin}</span>
                <span className="xl:hidden">Mom</span>
              </button>
              <button
                id="desktop-family-mode-btn"
                onClick={() => {
                  soundFX.playPop();
                  if (isMomMode) onToggleMomMode();
                }}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  !isMomMode 
                    ? isGlassTheme(currentTheme)
                      ? 'apple-glass-pill bg-white/10 dark:bg-black/10 text-white drop-shadow-sm shadow-xs font-black border-white/20'
                      : 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Kid / Helper View (Locks Mom Mode)"
              >
                <span className="hidden xl:inline">{t.kidChecklist}</span>
                <span className="xl:hidden">Kid</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
