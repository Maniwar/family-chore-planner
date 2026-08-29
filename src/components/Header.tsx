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
  CloudCheck
} from 'lucide-react';
import { HouseholdMember, HouseholdInfo } from '../types';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';
import { ThemePreset, THEMES } from '../utils/theme';
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
    <header className={`${theme.headerBg} border-b ${theme.headerBorder} sticky top-0 z-30 shadow-xs no-print transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
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
              <p className="text-[10px] text-slate-500 truncate max-w-[170px]">
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
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors active:scale-95 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
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
                  ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} shadow-2xs` 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isMomMode ? 'Tap to Lock Mom Mode (Switch to Kid View)' : 'Tap to Enter Mom / Admin Mode (PIN Required)'}
            >
              {isMomMode ? (
                <Unlock className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isMomMode ? 'Mom' : 'Kid'}</span>
            </button>

            {/* Quick Tools & Settings Modal Trigger */}
            <button
              id="mobile-quick-settings-btn"
              onClick={() => {
                soundFX.playPop();
                if (onOpenQuickSettings) onOpenQuickSettings();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors active:scale-95 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Quick Tools & Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Header Row (Hidden on mobile) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between py-2.5 sm:py-3 gap-2.5 sm:gap-3">
          
          {/* Brand, House Photo/Icon, Title & Quick Toggles */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            {/* House Photo Avatar or Default Home Emoji Icon */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  onOpenHouseSettings();
                }}
                className="relative group shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-2xl"
                title="Click to view/change house picture and settings"
              >
                {householdInfo.housePhotoUrl ? (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-2xs group-hover:border-rose-400 transition-colors">
                    <img
                      src={householdInfo.housePhotoUrl}
                      alt={householdInfo.familyName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${theme.primaryBg} flex items-center justify-center text-white shadow-2xs font-bold text-lg sm:text-xl transition-transform group-hover:scale-105`}>
                    🏡
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-300 text-[10px] text-slate-700 flex items-center justify-center shadow-2xs">
                  📷
                </span>
              </button>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
                    {householdInfo.familyName || t.appTitle}
                  </h1>
                  <span className={`hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} whitespace-nowrap`}>
                    {t.momsCommand}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                  {householdInfo.houseAddressOrMotto || t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Desktop Action Tools & Customization Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
                title="Select Language (English / Tagalog / Ilokano)"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>{SUPPORTED_LANGUAGES.find(l => l.code === language)?.flagEmoji}</span>
                <span className="hidden md:inline font-semibold">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 space-y-1">
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

            {/* Theme Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                title="Change Color Theme & Canvas Ambiance"
              >
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm leading-none">{theme.emoji}</span>
                <span className="hidden md:inline text-[11px] font-semibold text-slate-600">{theme.name.split(' ')[0]}</span>
              </button>

              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 space-y-1 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Palette className="w-3 h-3 text-amber-500" />
                        Themes & Backgrounds
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {Object.keys(THEMES).length} Presets
                      </span>
                    </div>
                    {(Object.keys(THEMES) as ThemePreset[]).map((tKey) => {
                      const th = THEMES[tKey];
                      const isSelected = currentTheme === tKey;
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
                              ? 'bg-slate-900 text-white shadow-xs font-bold' 
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">{th.emoji}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  {th.name}
                                </span>
                                {th.isDark && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-cyan-300'}`}>
                                    Dark
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
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
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title={householdInfo.isCloudSynced ? `Cloud Synced (${householdInfo.householdCode || 'Live'})` : 'Connect Multi-Family Cloud Sync'}
            >
              {householdInfo.isCloudSynced ? (
                <>
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono text-[11px] font-black text-emerald-700 hidden sm:inline">
                    {householdInfo.householdCode || 'SYNCED'}
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                  <span className="hidden sm:inline text-[11px]">Cloud Sync</span>
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
              className={`p-1.5 rounded-xl border transition-colors ${
                isSoundEnabled
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
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
                className="relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500 text-white shadow-xs hover:bg-amber-600 transition-all animate-pulse cursor-pointer"
                title={`${pendingInspectionCount} chores waiting for inspection`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pendingInspectionCount} {t.toInspect}</span>
              </button>
            )}

            {/* AI Auto-Assign Button (Mom Mode Only) */}
            {isMomMode && (
              <button
                id="header-ai-assign-btn"
                onClick={() => {
                  soundFX.playPop();
                  onOpenAIAssign();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xs cursor-pointer"
                title="AI Smart Auto-Assign Chores by Age & Milestones"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">{t.aiAutoAssign}</span>
                <span className="sm:hidden">AI</span>
              </button>
            )}

            {/* Google Calendar Button */}
            <button
              id="header-google-calendar-btn"
              onClick={() => {
                soundFX.playPop();
                onOpenGoogleCalendar();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Google Family Calendar Sync"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xl:inline">{t.googleCalendar}</span>
            </button>

            {/* Print Fridge Chart Button */}
            <button
              id="header-print-schedule-btn"
              onClick={() => {
                soundFX.playPop();
                onOpenPrintView();
              }}
              className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Printable Fridge Chore Schedules & Punchcards"
            >
              <Printer className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline">{t.printSchedule}</span>
            </button>

            {/* Add New Chore Button (Mom Mode Only) */}
            {isMomMode && (
              <button
                id="header-add-chore-btn"
                onClick={() => {
                  soundFX.playPop();
                  onOpenNewChore();
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-bold ${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover} transition-all shadow-xs cursor-pointer active:scale-95`}
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{t.newChore}</span>
              </button>
            )}

            {/* Mom Mode Switcher for Desktop */}
            <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                id="desktop-mom-mode-btn"
                onClick={() => {
                  soundFX.playPop();
                  if (!isMomMode) onToggleMomMode();
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isMomMode 
                    ? `bg-white ${theme.badgeText} shadow-xs` 
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
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isMomMode 
                    ? 'bg-white text-slate-900 shadow-xs' 
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
