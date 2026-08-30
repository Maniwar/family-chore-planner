import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Star, 
  Award, 
  Sparkles, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  TrendingUp,
  Gift,
  Flame,
  Calendar,
  Home,
  Camera,
  Heart,
  Settings,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import { HouseholdMember, Chore, HouseholdInfo } from '../types';
import { getMemberEffectiveAge } from '../utils/age';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface FamilyMembersViewProps {
  members: HouseholdMember[];
  chores: Chore[];
  householdInfo: HouseholdInfo;
  isMomMode?: boolean;
  currentTheme?: ThemePreset;
  onOpenNewMember: () => void;
  onEditMember: (member: HouseholdMember) => void;
  onDeleteMember: (memberId: string) => void;
  onAdjustPoints: (memberId: string, amount: number, reason: string) => void;
  onOpenHouseSettings: () => void;
}

export const FamilyMembersView: React.FC<FamilyMembersViewProps> = ({
  members,
  chores,
  householdInfo,
  isMomMode = true,
  currentTheme = 'rose',
  onOpenNewMember,
  onEditMember,
  onDeleteMember,
  onAdjustPoints,
  onOpenHouseSettings,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [bonusMemberId, setBonusMemberId] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(10);
  const [bonusReason, setBonusReason] = useState<string>('Great help around the house!');

  const handleGiveBonus = (memberId: string) => {
    if (bonusAmount !== 0) {
      soundFX.playStarChime(5);
      onAdjustPoints(memberId, bonusAmount, bonusReason);
      setBonusMemberId(null);
    }
  };

  const activeSuperstarsCount = members.filter(m => m.role !== 'parent').length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* iOS Large Title Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Family & Household
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage superstars, point targets, weekly streaks, and household settings
          </p>
        </div>

        {isMomMode && (
          <button
            onClick={() => {
              soundFX.playPop();
              onOpenNewMember();
            }}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[44px] shrink-0 self-start sm:self-auto ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : `${theme.primaryBg} ${theme.primaryText} ${theme.primaryHover}`}`}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Household Hub Hero Card (Apple Inset Style with Zero Text Overlaps) */}
      <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-3xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200/90'} shadow-xs overflow-hidden transition-all`}>
        {/* Cover Photo / Graphic Section */}
        {householdInfo.housePhotoUrl ? (
          <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
            <img
              src={householdInfo.housePhotoUrl}
              alt={householdInfo.familyName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Dark Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Overlay Content */}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold text-rose-200 border border-white/15 shadow-sm">
                  <Home className="w-3.5 h-3.5 text-rose-400" />
                  <span>Our Household Hub</span>
                </div>

                {isMomMode && (
                  <button
                    onClick={() => {
                      soundFX.playPop();
                      onOpenHouseSettings();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/90 hover:bg-white text-slate-900 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>Edit Photo</span>
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                  {householdInfo.familyName || 'Our Family Home'}
                </h2>
                {householdInfo.houseAddressOrMotto && (
                  <p className="text-xs sm:text-sm text-slate-200 mt-0.5 font-medium line-clamp-2">
                    {householdInfo.houseAddressOrMotto}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Rich Gradient Banner when no photo uploaded */
          <div className="relative p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                  🏡
                </div>
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-rose-200 border border-white/15">
                    <Home className="w-3 h-3 text-rose-400" />
                    <span>Our Household Hub</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                    {householdInfo.familyName || 'Berenji House'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-snug">
                    {householdInfo.houseAddressOrMotto || 'Clean spaces, happy smiles & teamwork! ✨'}
                  </p>
                </div>
              </div>

              {isMomMode && (
                <button
                  onClick={() => {
                    soundFX.playPop();
                    onOpenHouseSettings();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer min-h-[40px] self-start sm:self-auto"
                >
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>Upload Photo & Settings</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Snapshot Bar: Stacked Avatars + Quick Household Info */}
        <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden py-0.5">
              {members.map((m) => (
                <div key={m.id} className="relative ring-2 ring-white rounded-full bg-white">
                  <Avatar
                    photoUrl={m.avatarPhotoUrl}
                    emoji={m.avatarEmoji}
                    name={m.name}
                    size="sm"
                    showBorder={false}
                  />
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">
              {members.length} Family Superstars ({activeSuperstarsCount} Helpers)
            </span>
          </div>

          {isMomMode && (
            <button
              onClick={() => {
                soundFX.playPop();
                onOpenHouseSettings();
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>House Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {members.map((member) => {
          const assignedChores = chores.filter(c => c.assignedMemberId === member.id && c.isActive);
          const targetPts = member.targetWeeklyPoints || 100;
          const weeklyProgress = Math.min(100, Math.round((member.currentPoints / targetPts) * 100));
          const effectiveAge = getMemberEffectiveAge(member);
          const isBonusOpen = bonusMemberId === member.id;

          return (
            <div
              key={member.id}
              className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200/90'} p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden`}
            >
              <div>
                {/* Header: Photo / Avatar, Name, Role, Age & Mom Controls */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      photoUrl={member.avatarPhotoUrl}
                      emoji={member.avatarEmoji}
                      name={member.name}
                      size="lg"
                      className="shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {member.name}
                        </h3>
                        {effectiveAge !== undefined && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {effectiveAge} yrs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                          {member.role === 'teen' ? 'Teen / Adult' : member.role === 'parent' ? 'Parent / Admin' : 'Kid Helper'}
                        </span>
                        {member.birthDate && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{member.birthDate}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isMomMode && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => {
                          soundFX.playPop();
                          onEditMember(member);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                        title="Edit Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {members.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${member.name} from the family hub?`)) {
                              onDeleteMember(member.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 3-Column Points & Stats Container (Apple Inset Style) */}
                <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 mb-3.5 text-center">
                  <div className="p-1 rounded-xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Available
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-900 block leading-tight mt-0.5">
                      {member.currentPoints} <span className="text-[10px] font-normal text-amber-700">pts</span>
                    </span>
                  </div>
                  <div className="p-1 rounded-xl border-x border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Lifetime
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-700 block leading-tight mt-0.5">
                      {member.lifetimePoints}
                    </span>
                  </div>
                  <div className="p-1 rounded-xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      5⭐ Stars
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-500 flex items-center justify-center gap-0.5 leading-tight mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{member.starsCount || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Weekly Goal Progress Bar */}
                <div className="space-y-1.5 mb-3.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1 font-bold">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Weekly Goal ({member.currentPoints}/{targetPts} pts)</span>
                    </span>
                    <span className={`font-black ${weeklyProgress >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {weeklyProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        weeklyProgress >= 100
                          ? (isGlassTheme(currentTheme) ? 'bg-emerald-500/20' : 'bg-gradient-to-r from-emerald-500 to-teal-500')
                          : (isGlassTheme(currentTheme) ? 'bg-rose-500/20' : 'bg-gradient-to-r from-amber-400 to-rose-500')
                      }`}
                      style={{ width: `${weeklyProgress}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Routine List */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Active Routines ({assignedChores.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedChores.length > 0 ? (
                      assignedChores.slice(0, 4).map(c => (
                        <span
                          key={c.id}
                          className="inline-block text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/80 truncate max-w-[150px]"
                          title={c.title}
                        >
                          {c.title}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No recurring chores assigned</span>
                    )}
                    {assignedChores.length > 4 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        +{assignedChores.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bonus / Point Adjustment Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                {isMomMode ? (
                  <button
                    onClick={() => {
                      soundFX.playPop();
                      setBonusMemberId(isBonusOpen ? null : member.id);
                    }}
                    className={`inline-flex items-center gap-1 text-xs font-bold transition-all py-1.5 px-3 rounded-xl cursor-pointer min-h-[36px] active:scale-95 ${
                      isBonusOpen
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{isBonusOpen ? 'Close' : 'Award Bonus'}</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    Keep shining! 🌟
                  </span>
                )}

                <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  <span>{member.streakDays || 0}d Streak</span>
                </div>
              </div>

              {/* Point Bonus Input Inline Sheet (Mom Mode Only) */}
              {isMomMode && isBonusOpen && (
                <div className="mt-3 p-3 bg-indigo-50/90 rounded-2xl border border-indigo-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Award Bonus to {member.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Instant Balance Update</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2 rounded-xl border border-indigo-300 shrink-0 min-h-[40px]">
                      <span className="text-xs font-bold text-amber-600">⭐</span>
                      <input
                        type="number"
                        value={bonusAmount}
                        onChange={(e) => setBonusAmount(Number(e.target.value))}
                        className="w-14 text-sm font-black text-indigo-950 focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={bonusReason}
                      onChange={(e) => setBonusReason(e.target.value)}
                      placeholder="Reason (e.g., washed car)..."
                      className="flex-1 text-xs p-2 rounded-xl bg-white border border-indigo-300 font-medium text-slate-800 focus:outline-none min-h-[40px]"
                    />
                  </div>
                  <button
                    onClick={() => handleGiveBonus(member.id)}
                    className={`w-full py-2 rounded-xl active:scale-95 font-bold text-xs shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px] ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Send +{bonusAmount} Points</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
