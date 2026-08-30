import React from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Cloud, 
  CheckCircle2, 
  Calendar, 
  Printer, 
  Globe, 
  Palette, 
  Home, 
  Users, 
  Sparkles, 
  RotateCcw, 
  ChevronRight, 
  ListTodo, 
  Gift 
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../utils/i18n';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { BadgeStyle, BADGE_STYLES, CategoryBadge, StarPointsBadge } from './CategoryBadge';
import { HouseholdInfo } from '../types';
import { soundFX } from '../utils/audio';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  currentTheme: ThemePreset;
  onSelectTheme: (theme: ThemePreset) => void;
  badgeStyle?: BadgeStyle;
  onSelectBadgeStyle?: (style: BadgeStyle) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  householdInfo: HouseholdInfo;
  onOpenCloudSync?: () => void;
  onOpenGoogleCalendar?: () => void;
  onOpenPrintView?: () => void;
  onOpenFamilyMembers?: () => void;
  onOpenChoreLibrary?: () => void;
  onOpenAIAssign?: () => void;
  onOpenRedemptions?: () => void;
  onOpenHouseSettings?: () => void;
  onResetDemo?: () => void;
  isMomMode?: boolean;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  currentTheme,
  onSelectTheme,
  badgeStyle = 'pastel',
  onSelectBadgeStyle,
  isSoundEnabled,
  onToggleSound,
  householdInfo,
  onOpenCloudSync,
  onOpenGoogleCalendar,
  onOpenPrintView,
  onOpenFamilyMembers,
  onOpenChoreLibrary,
  onOpenAIAssign,
  onOpenRedemptions,
  onOpenHouseSettings,
  onResetDemo,
  isMomMode = true,
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 60,
  });

  const [badgeFilter, setBadgeFilter] = React.useState<'all' | 'emoji' | 'vector' | 'thematic'>('all');

  if (!isOpen) return null;

  const theme = THEMES[currentTheme] || THEMES.rose;
  const isGlass = isGlassTheme(currentTheme);

  const filteredBadgeStyles = BADGE_STYLES.filter((b) => {
    if (badgeFilter === 'all') return true;
    return b.category === badgeFilter;
  });

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 ${isGlass ? 'bg-slate-900/15 backdrop-blur-md' : 'bg-slate-950/60 backdrop-blur-sm'}`}
      onClick={handleDismiss}
    >
      {/* Chrome Layer: Modal Sheet Container */}
      <div 
        style={sheetStyle}
        className={`relative w-full max-w-lg rounded-t-[32px] sm:rounded-[28px] border-t sm:border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-300 safe-area-pb ${
          isGlass
            ? 'apple-glass-panel border-white/20'
            : theme.isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200/90 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Interactive Grabber Touch Bar */}
        <div className={`shrink-0 border-b ${isGlass ? 'border-white/40 bg-white/20' : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/80'}`}>
          <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />
        </div>

        {/* Navigation Bar Header */}
        <div 
          className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
            isGlass
              ? 'border-white/40 bg-white/30 backdrop-blur-md'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90'
          }`}
        >
          <div 
            className="flex items-center space-x-3 flex-1 min-w-0 select-none cursor-grab active:cursor-grabbing"
            onTouchStart={dragHandleProps.onTouchStart}
            onPointerDown={dragHandleProps.onPointerDown}
          >
            <div className={`w-9 h-9 rounded-2xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center text-base font-black shadow-xs shrink-0 border border-white/40`}>
              🏡
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tight leading-tight truncate text-slate-950 dark:text-white">
                Household & Cloud Hub
              </h2>
              <p className="text-[11px] font-bold truncate text-slate-700 dark:text-slate-300">
                {householdInfo.familyName || 'Family Home'} · Setup & Settings
              </p>
            </div>
          </div>
          
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              soundFX.playPop();
              handleDismiss();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer shrink-0 z-20 shadow-2xs ${
              isGlass
                ? 'bg-white/40 hover:bg-white/60 text-slate-900 border border-white/20 backdrop-blur-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
            }`}
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body - Translucent Glass / Content Layer */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TOP SPOTLIGHT: FAMILY CLOUD SYNC BANNER */}
          {!householdInfo.isCloudSynced ? (
            <div className={`w-full box-border rounded-2xl p-4 shadow-md ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/40 text-slate-900' : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-extrabold tracking-wide uppercase border border-white/30">
                    <Cloud className="w-3 h-3 text-sky-200" />
                    <span>First-Time Cloud Setup</span>
                  </div>
                  <h3 className="text-sm font-extrabold leading-snug">
                    Set Up Your Family on the Cloud
                  </h3>
                  <p className="text-xs text-sky-100 leading-relaxed font-medium">
                    Connect your household to sync chore boards, kids' point balances, and live photos in real-time across all family phones, tablets & browsers.
                  </p>
                </div>
              </div>
              <button
                id="setup-family-cloud-cta-btn"
                onClick={() => {
                  soundFX.playFanfare();
                  onClose();
                  if (onOpenCloudSync) onOpenCloudSync();
                }}
                className="mt-3.5 w-full py-2.5 px-4 bg-white/95 hover:bg-white text-sky-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <Cloud className="w-4 h-4 text-sky-600" />
                <span>Set Up Family Cloud Hub Now</span>
                <ChevronRight className="w-3.5 h-3.5 text-sky-600 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                soundFX.playPop();
                onClose();
                if (onOpenCloudSync) onOpenCloudSync();
              }}
              className={`w-full box-border rounded-2xl p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 shadow-2xs group border ${
                isGlass
                  ? 'border-emerald-300/80 bg-emerald-500/20 backdrop-blur-md hover:bg-emerald-500/30'
                  : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:border-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs border border-emerald-400/50">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-100 truncate">
                      Family Cloud Active
                    </p>
                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 border border-emerald-400/80 shrink-0">
                      {householdInfo.householdCode || 'LIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 truncate font-semibold mt-0.5">
                    Multi-device real-time sync active · Tap to manage or invite devices
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 dark:text-emerald-300 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
            </button>
          )}

          {/* GROUP 1: FAMILY & HOUSEHOLD MANAGEMENT */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Family & Household
              </span>
              {isMomMode && (
                <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                  Parent Mode Active
                </span>
              )}
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-2xs ${
              isGlass
                ? 'border-white/70 bg-white/45 backdrop-blur-md divide-y divide-white/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800'
            }`}>
              
              {/* Row 1: Household Members & Profiles */}
              <button
                id="settings-manage-family-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenFamilyMembers) onOpenFamilyMembers();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center shrink-0 shadow-2xs border border-white/30`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      Family Members & Profiles
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      Helpers, avatars, point balances & PINs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Row 2: House Photo & Motto Settings */}
              <button
                id="settings-house-motto-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenHouseSettings) onOpenHouseSettings();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 shadow-2xs border border-indigo-200 dark:border-indigo-800">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      House Details & Motto
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      "{householdInfo.motto || 'Clean spaces, happy smiles'}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 2: CHORES, REWARDS & TOOLS */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Chores, Rewards & Tools
              </span>
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-2xs ${
              isGlass
                ? 'border-white/70 bg-white/45 backdrop-blur-md divide-y divide-white/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800'
            }`}>
              
              {/* Row 1: Chore Library & Routine Templates */}
              <button
                id="settings-chore-library-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenChoreLibrary) onOpenChoreLibrary();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0 shadow-2xs border border-pink-200 dark:border-pink-800">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                        Chore Library & Templates
                      </p>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 rounded-full border border-pink-200 dark:border-pink-800 shrink-0">
                        Library
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      Routine templates, schedules & inspection standards
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Row 2: AI Smart Chore Assigner & Coach */}
              <button
                id="settings-ai-assign-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenAIAssign) onOpenAIAssign();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs border border-purple-400/40">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                        AI Smart Assigner & Coach
                      </p>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800 shrink-0">
                        ✨ Gemini AI
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      AI age-appropriate workload balancing & parenting advice
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Row 3: Reward Redemptions & Claims Log */}
              <button
                id="settings-redemptions-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenRedemptions) onOpenRedemptions();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-200 dark:border-emerald-800">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      Reward Redemptions & Claims
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      Review & approve helper prize claims & points ledger
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Row 4: Fridge Printouts */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenPrintView) onOpenPrintView();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 shadow-2xs border border-rose-200 dark:border-rose-800">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      Fridge Charts & Printables
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      Weekly printable chore sheets & quality checklist
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Row 5: Google Calendar */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenGoogleCalendar) onOpenGoogleCalendar();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-2xs border border-blue-200 dark:border-blue-800">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      Calendar Sync & Schedule
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      View full household chores on Google Calendar
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 3: APPEARANCE & PREFERENCES */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Appearance & Sounds
              </span>
            </div>

            <div className={`rounded-2xl border p-3.5 sm:p-4 space-y-4 shadow-2xs ${
              isGlass
                ? 'border-white/70 bg-white/45 backdrop-blur-md'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}>
              
              {/* Theme Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span>Color Ambiance Theme</span>
                  </span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                    {theme.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {(Object.keys(THEMES) as ThemePreset[]).map((tKey) => {
                    const th = THEMES[tKey];
                    const isSelected = currentTheme === tKey;
                    const labelName = tKey === 'frosted_glass'
                      ? 'Frosted Glass'
                      : tKey === 'crystal_ice'
                      ? 'Glacial Ice'
                      : th.name.split(' ')[0] === 'Cozy' || th.name.split(' ')[0] === 'Tropical' || th.name.split(' ')[0] === 'Enchanted' || th.name.split(' ')[0] === 'Sunset' || th.name.split(' ')[0] === 'Pastel' || th.name.split(' ')[0] === 'Nordic' || th.name.split(' ')[0] === 'Royal'
                      ? th.name.split(' ')[1] || th.name.split(' ')[0]
                      : th.name.split(' ')[0];
                    return (
                      <button
                        key={tKey}
                        onClick={() => {
                          soundFX.playPop();
                          onSelectTheme(tKey);
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all text-left cursor-pointer min-h-[44px] active:scale-95 ${
                          isSelected
                            ? `${th.primaryBg} ${th.primaryText} border-transparent font-black shadow-xs`
                            : isGlass
                            ? 'bg-white/40 text-slate-900 border-white/20 hover:bg-white/60 font-bold backdrop-blur-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold'
                        }`}
                      >
                        <span className="text-base shrink-0">{th.emoji}</span>
                        <span className="text-xs font-bold truncate">{labelName}</span>
                        {isSelected && <span className="ml-auto text-xs font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Glass & Ice Shader Status Callout */}
                {isGlassTheme(currentTheme) && (
                  <div className="mt-3 p-3 rounded-2xl bg-white/40 dark:bg-sky-950/40 border border-white/20 dark:border-sky-800 flex items-center justify-between gap-2.5 backdrop-blur-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/60 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 flex items-center justify-center text-base shrink-0 border border-white/20">
                        {currentTheme === 'crystal_ice' ? '❄️' : '🫧'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-950 dark:text-sky-100 flex items-center gap-1.5">
                          <span>{currentTheme === 'crystal_ice' ? 'Glacial Ice & Polar Frost' : 'Frosted Glass UI & Refraction'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/80 dark:bg-sky-800 text-sky-950 dark:text-sky-100 font-black uppercase border border-white/20 dark:border-sky-700">Active Theme</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold truncate">
                          {currentTheme === 'crystal_ice' 
                            ? 'Subzero crystal frost texture, specular highlights & optical caustics'
                            : 'Glassmorphism 2.0: Linear gradients + 20px blur + specular inner borders'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Icon & Badge Aesthetic Selector with Live Previews */}
              <div className={`pt-3 border-t ${isGlass ? 'border-white/30' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Icon & Badge Style</span>
                  </span>
                  <span className="text-[11px] font-black text-pink-700 dark:text-pink-400">
                    {BADGE_STYLES.find((b) => b.id === badgeStyle)?.name || 'Original'}
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all', label: 'All Sets (12)' },
                    { id: 'emoji', label: '🏡 Emoji (5)' },
                    { id: 'vector', label: '🌸 Vector (2)' },
                    { id: 'thematic', label: '🎨 Thematic (5)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBadgeFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        badgeFilter === f.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                          : isGlass
                          ? 'bg-white/40 text-slate-800 hover:bg-white/60 border border-white/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-0.5">
                  {filteredBadgeStyles.map((opt) => {
                    const isSelected = badgeStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundFX.playPop();
                          if (onSelectBadgeStyle) onSelectBadgeStyle(opt.id);
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[66px] flex flex-col justify-between gap-1.5 active:scale-98 ${
                          isSelected
                            ? isGlass
                              ? 'bg-white/80 border-pink-500 ring-2 ring-pink-500/20 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-800 border-pink-500 ring-2 ring-pink-500/20 shadow-xs font-bold'
                            : isGlass
                            ? 'bg-white/35 border-white/20 hover:bg-white/55 text-slate-900 backdrop-blur-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-950 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{opt.emoji}</span>
                            <span>{opt.name}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-pink-500 text-white shrink-0">
                              Active ✓
                            </span>
                          )}
                        </div>

                        {/* Live Visual Badge & Star Preview */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <CategoryBadge category="Kitchen" size="sm" style={opt.id} />
                            <StarPointsBadge points={15} size="sm" style={opt.id} />
                          </div>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[100px]">
                            {opt.tagline.split('&')[0]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* iOS Segmented Language Picker */}
              <div className={`pt-2 border-t ${isGlass ? 'border-white/30' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Select Language / Wika</span>
                  </span>
                </div>

                {/* Apple Segmented Control */}
                <div className={`p-1 rounded-xl flex gap-1 border ${
                  isGlass
                    ? 'bg-white/30 border-white/50 backdrop-blur-xs'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700'
                }`}>
                  {SUPPORTED_LANGUAGES.map((langOpt) => {
                    const isSelected = language === langOpt.code;
                    return (
                      <button
                        key={langOpt.code}
                        onClick={() => {
                          soundFX.playPop();
                          onSelectLanguage(langOpt.code);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer ${
                          isSelected
                            ? 'bg-white/90 text-slate-950 shadow-2xs font-black'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 font-semibold'
                        }`}
                      >
                        <span className="text-sm">{langOpt.flagEmoji}</span>
                        <span>{langOpt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* iOS Style Sound Effects Switch Row */}
              <div className={`pt-2 border-t flex items-center justify-between gap-3 ${isGlass ? 'border-white/30' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isSoundEnabled ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                    {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">Sound Effects & Haptics</p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Audio feedback on completion & rewards</p>
                  </div>
                </div>

                {/* iOS Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isSoundEnabled}
                  onClick={() => {
                    onToggleSound();
                    if (!isSoundEnabled) soundFX.playPop();
                  }}
                  className={`w-12 h-7 rounded-full p-0.5 transition-colors cursor-pointer min-h-[28px] shrink-0 ${
                    isSoundEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* GROUP 4: CLOUD SYNC & DATA MANAGEMENT */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Data & Cloud Settings
              </span>
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-2xs ${
              isGlass
                ? 'border-white/70 bg-white/45 backdrop-blur-md divide-y divide-white/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800'
            }`}>
              
              {/* Cloud Sync Row */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenCloudSync) onOpenCloudSync();
                }}
                className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                  isGlass
                    ? 'hover:bg-white/40 active:bg-white/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${householdInfo.isCloudSynced ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'} flex items-center justify-center shrink-0 shadow-2xs`}>
                    {householdInfo.isCloudSynced ? <CheckCircle2 className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white truncate">
                      Cloud Sync & Multi-Device
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      {householdInfo.isCloudSynced ? 'Synced via Firebase Firestore 🟢' : 'Connect cloud database for family sync ☁️'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>

              {/* Reset Demo Data Action */}
              {isMomMode && onResetDemo && (
                <button
                  onClick={() => {
                    if (confirm('Reset all demo data (chores, members, points) back to original default?')) {
                      soundFX.playPop();
                      onClose();
                      onResetDemo();
                    }
                  }}
                  className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer min-h-[52px] group ${
                    isGlass
                      ? 'hover:bg-rose-100/50 active:bg-rose-100/70'
                      : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 shadow-2xs border border-rose-200 dark:border-rose-800">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 truncate">
                        Reset to Default Demo Data
                      </p>
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium truncate">
                        Restore initial chores, schedules & balances
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 stroke-[2.5] text-rose-400 group-hover:text-rose-600" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
