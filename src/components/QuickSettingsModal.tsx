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

  if (!isOpen) return null;

  const theme = THEMES[currentTheme] || THEMES.rose;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      {/* iOS Bottom Sheet / Modal Card */}
      <div 
        style={sheetStyle}
        className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[28px] border-t sm:border border-slate-200/90 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-300 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Interactive Grabber Touch Bar */}
        <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />

        {/* Navigation Bar Header with Drag Handle Support */}
        <div 
          className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 backdrop-blur-sm touch-none select-none cursor-grab active:cursor-grabbing"
          onTouchStart={dragHandleProps.onTouchStart}
          onTouchMove={dragHandleProps.onTouchMove}
          onTouchEnd={dragHandleProps.onTouchEnd}
          onPointerDown={dragHandleProps.onPointerDown}
          onPointerMove={dragHandleProps.onPointerMove}
          onPointerUp={dragHandleProps.onPointerUp}
        >
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center text-sm font-black shadow-2xs`}>
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                Settings & Tools
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {householdInfo.houseName} · Household Hub
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              soundFX.playPop();
              handleDismiss();
            }}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90 cursor-pointer min-h-[36px] min-w-[36px]"
            title="Close Settings"
            aria-label="Close Settings"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body - Apple Inset Grouped Style */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* GROUP 1: HOUSEHOLD & MANAGEMENT */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Household Management
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

              {/* Row 2: Chore Library & Routine Templates */}
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

              {/* Row 3: AI Smart Chore Assigner & Coach */}
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

              {/* Row 4: Reward Redemptions & Claims Log */}
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

              {/* Row 5: House Photo & Motto Settings */}
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

              {/* Row 6: Fridge Printouts */}
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

              {/* Row 7: Google Calendar */}
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

          {/* GROUP 2: APPEARANCE & PREFERENCES */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Appearance & Audio
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

          {/* GROUP 3: CLOUD SYNC & DATA */}
          <div>
            <div className="px-1 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Cloud Sync & Data
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
