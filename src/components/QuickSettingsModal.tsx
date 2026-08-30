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
  ShieldCheck,
  Smartphone,
  ListTodo,
  Gift,
  Wand2
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../utils/i18n';
import { ThemePreset, THEMES } from '../utils/theme';
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

  const filteredBadgeStyles = BADGE_STYLES.filter((b) => {
    if (badgeFilter === 'all') return true;
    return b.category === badgeFilter;
  });

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      {/* iOS Bottom Sheet / Modal Card */}
      <div 
        style={sheetStyle}
        className={`relative w-full max-w-lg rounded-t-[32px] sm:rounded-[28px] border-t sm:border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-300 safe-area-pb ${
          theme.isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200/90 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Interactive Grabber Touch Bar */}
        <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />

        {/* Navigation Bar Header */}
        <div 
          className={`px-5 py-3 border-b flex items-center justify-between backdrop-blur-sm ${
            theme.isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-50/70 border-slate-100'
          }`}
        >
          <div 
            className="flex items-center space-x-2.5 flex-1 min-w-0 select-none cursor-grab active:cursor-grabbing"
            onTouchStart={dragHandleProps.onTouchStart}
            onPointerDown={dragHandleProps.onPointerDown}
          >
            <div className={`w-8 h-8 rounded-xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center text-sm font-black shadow-2xs shrink-0`}>
              🏡
            </div>
            <div className="min-w-0 truncate">
              <h2 className={`text-base font-extrabold tracking-tight leading-tight truncate ${theme.isDark ? 'text-white' : 'text-slate-900'}`}>
                Household & Cloud Hub
              </h2>
              <p className={`text-[11px] font-medium truncate ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {householdInfo.familyName || 'Family Home'} · Family Setup & Settings
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
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer shrink-0 z-20 ${
              theme.isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700'
            }`}
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body - Apple Inset Grouped Style */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TOP SPOTLIGHT: FAMILY CLOUD SYNC BANNER (Apple ID / iCloud style onboarding) */}
          {!householdInfo.isCloudSynced ? (
            <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-md border border-sky-400/30">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold tracking-wide uppercase">
                    <Cloud className="w-3 h-3 text-sky-200" />
                    <span>First-Time Cloud Setup</span>
                  </div>
                  <h3 className="text-sm font-extrabold leading-snug">
                    Set Up Your Family on the Cloud
                  </h3>
                  <p className="text-xs text-sky-100 leading-relaxed">
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
                className="mt-3.5 w-full py-2.5 px-4 bg-white hover:bg-sky-50 text-sky-800 font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-2xl p-3.5 text-left transition-all active:scale-98 cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-extrabold text-emerald-950 truncate">
                      Family Cloud Active
                    </p>
                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                      {householdInfo.householdCode || 'LIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 truncate">
                    Multi-device real-time sync active · Tap to manage or invite devices
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          )}

          {/* GROUP 1: FAMILY & HOUSEHOLD MANAGEMENT */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Family & Household
              </span>
              {isMomMode && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Parent Mode Active
                </span>
              )}
            </div>

            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-200/60 shadow-2xs">
              
              {/* Row 1: Household Members & Profiles */}
              <button
                id="settings-manage-family-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenFamilyMembers) onOpenFamilyMembers();
                }}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center shrink-0 shadow-2xs`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Family Members & Profiles
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Helpers, avatars, point balances & PINs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      House Details & Motto
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      "{householdInfo.motto || 'Clean spaces, happy smiles'}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 2: CHORES, REWARDS & ROUTINES */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Chores, Rewards & Tools
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-200/60 shadow-2xs">
              
              {/* Row 1: Chore Library & Routine Templates */}
              <button
                id="settings-chore-library-btn"
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenChoreLibrary) onOpenChoreLibrary();
                }}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        Chore Library & Templates
                      </p>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-pink-50 text-pink-700 rounded-full border border-pink-200 shrink-0">
                        Library
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Routine templates, schedules & inspection standards
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        AI Smart Assigner & Coach
                      </p>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded-full border border-purple-200 shrink-0">
                        ✨ Gemini AI
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      AI age-appropriate workload balancing & parenting advice
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Reward Redemptions & Claims
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Review & approve helper prize claims & points ledger
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Fridge Charts & Printables
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Weekly printable chore sheets & quality checklist
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Calendar Sync & Schedule
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      View full household chores on Google Calendar
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          </div>

          {/* GROUP 3: APPEARANCE & PREFERENCES */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Appearance & Sounds
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 space-y-4 shadow-2xs">
              
              {/* Theme Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-500" />
                    <span>Color Ambiance Theme</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {theme.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(THEMES) as ThemePreset[]).map((tKey) => {
                    const th = THEMES[tKey];
                    const isSelected = currentTheme === tKey;
                    const labelName = th.name.split(' ')[0] === 'Cozy' || th.name.split(' ')[0] === 'Tropical' || th.name.split(' ')[0] === 'Enchanted' || th.name.split(' ')[0] === 'Sunset' || th.name.split(' ')[0] === 'Pastel' || th.name.split(' ')[0] === 'Nordic' || th.name.split(' ')[0] === 'Royal'
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
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <span className="text-base shrink-0">{th.emoji}</span>
                        <span className="text-xs font-bold truncate">{labelName}</span>
                        {isSelected && <span className="ml-auto text-xs font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon & Badge Aesthetic Selector with Live Previews */}
              <div className="pt-3 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Icon & Badge Style</span>
                  </span>
                  <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
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
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-0.5">
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
                            ? 'bg-white dark:bg-slate-800 border-pink-500 ring-2 ring-pink-500/20 shadow-xs'
                            : 'bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
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
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
                            {opt.tagline.split('&')[0]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* iOS Segmented Language Picker */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Select Language / Wika</span>
                  </span>
                </div>

                {/* Apple Segmented Control */}
                <div className="p-1 bg-slate-200/80 rounded-xl flex gap-1">
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
                            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
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
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isSoundEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                    {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sound Effects & Haptics</p>
                    <p className="text-[11px] text-slate-500">Audio feedback on completion & rewards</p>
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
                    isSoundEnabled ? 'bg-emerald-500' : 'bg-slate-300'
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
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Data & Cloud Settings
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-200/60 shadow-2xs">
              
              {/* Cloud Sync Row */}
              <button
                onClick={() => {
                  soundFX.playPop();
                  onClose();
                  if (onOpenCloudSync) onOpenCloudSync();
                }}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors cursor-pointer min-h-[52px] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${householdInfo.isCloudSynced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} flex items-center justify-center shrink-0 shadow-2xs`}>
                    {householdInfo.isCloudSynced ? <CheckCircle2 className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Cloud Sync & Multi-Device
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {householdInfo.isCloudSynced ? 'Synced via Firebase Firestore 🟢' : 'Connect cloud database for family sync ☁️'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-rose-50/80 active:bg-rose-100/60 transition-colors cursor-pointer min-h-[52px] group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-rose-600 truncate">
                        Reset to Default Demo Data
                      </p>
                      <p className="text-[11px] text-rose-400 truncate">
                        Restore initial chores, schedules & balances
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 stroke-[2.5] text-rose-300 group-hover:text-rose-500" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
