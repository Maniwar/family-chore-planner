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
  Heart
} from 'lucide-react';
import { HouseholdMember, Chore, HouseholdInfo } from '../types';
import { getMemberEffectiveAge } from '../utils/age';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';

interface FamilyMembersViewProps {
  members: HouseholdMember[];
  chores: Chore[];
  householdInfo: HouseholdInfo;
  isMomMode?: boolean;
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
  onOpenNewMember,
  onEditMember,
  onDeleteMember,
  onAdjustPoints,
  onOpenHouseSettings,
}) => {
  const [bonusMemberId, setBonusMemberId] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(10);
  const [bonusReason, setBonusReason] = useState<string>('Great spontaneous help around the house!');

  const handleGiveBonus = (memberId: string) => {
    if (bonusAmount !== 0) {
      onAdjustPoints(memberId, bonusAmount, bonusReason);
      setBonusMemberId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Household & House Profile Card Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
          {householdInfo.housePhotoUrl ? (
            <img
              src={householdInfo.housePhotoUrl}
              alt={householdInfo.familyName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-center">
              <div className="text-white/80 space-y-1">
                <div className="text-4xl sm:text-5xl mb-2">🏡</div>
                <p className="text-sm font-semibold text-slate-300">Our Family Home</p>
                <p className="text-xs text-slate-400">Working together every day to keep our house shining!</p>
              </div>
            </div>
          )}

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* House Info Banner overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-rose-200 border border-white/20">
                <Home className="w-3 h-3" />
                <span>Our Household Hub</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {householdInfo.familyName || 'Our Family Home'}
              </h2>
              {householdInfo.houseAddressOrMotto && (
                <p className="text-xs sm:text-sm text-slate-200 max-w-xl font-medium">
                  {householdInfo.houseAddressOrMotto}
                </p>
              )}
            </div>

            {isMomMode && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onOpenHouseSettings();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-rose-600" />
                <span>{householdInfo.housePhotoUrl ? 'Change House Photo' : 'Upload House Photo'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Family Snapshot Row */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden py-1">
              {members.map((m) => (
                <Avatar
                  key={m.id}
                  photoUrl={m.avatarPhotoUrl}
                  emoji={m.avatarEmoji}
                  name={m.name}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">
              {members.length} Family Helpers & Superstars
            </span>
          </div>

          {isMomMode && (
            <button
              onClick={() => {
                soundFX.playPop();
                onOpenNewMember();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Family Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => {
          const assignedChores = chores.filter(c => c.assignedMemberId === member.id && c.isActive);
          const weeklyProgress = Math.min(100, Math.round((member.currentPoints / (member.targetWeeklyPoints || 100)) * 100));
          const effectiveAge = getMemberEffectiveAge(member);

          return (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Photo / Avatar, Name, Role */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      photoUrl={member.avatarPhotoUrl}
                      emoji={member.avatarEmoji}
                      name={member.name}
                      size="lg"
                      className="shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-slate-900">
                          {member.name}
                        </h3>
                        {effectiveAge !== undefined && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {effectiveAge} yrs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                          {member.role === 'teen' ? 'Teen / Adult' : member.role}
                        </span>
                        {member.birthDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {member.birthDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isMomMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          soundFX.playPop();
                          onEditMember(member);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Member & Photo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {members.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${member.name} from the family hub?`)) {
                              onDeleteMember(member.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Points & Stats Badges */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-br from-slate-50 to-amber-50/40 rounded-2xl border border-slate-200 mb-4 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Available</span>
                    <span className="text-base font-extrabold text-amber-900">
                      {member.currentPoints} <span className="text-[10px] font-normal">pts</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime</span>
                    <span className="text-base font-extrabold text-slate-700">
                      {member.lifetimePoints}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">5⭐ Stars</span>
                    <span className="text-base font-extrabold text-amber-500 flex items-center justify-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {member.starsCount}
                    </span>
                  </div>
                </div>

                {/* Weekly Target Goal Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Weekly Goal ({member.currentPoints}/{member.targetWeeklyPoints || 100} pts)</span>
                    </span>
                    <span className="text-emerald-700 font-bold">{weeklyProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        weeklyProgress >= 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-amber-400 to-rose-500'
                      }`}
                      style={{ width: `${weeklyProgress}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Routine List */}
                <div className="space-y-1 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active Routines ({assignedChores.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedChores.length > 0 ? (
                      assignedChores.slice(0, 4).map(c => (
                        <span
                          key={c.id}
                          className="inline-block text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 truncate max-w-[130px]"
                        >
                          {c.title}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No recurring chores assigned yet</span>
                    )}
                    {assignedChores.length > 4 && (
                      <span className="text-[11px] font-semibold text-slate-400 px-1 py-0.5">
                        +{assignedChores.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bonus / Point Adjustment Footer (Mom Mode Only for adjustments, always show streak) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isMomMode ? (
                  <button
                    onClick={() => setBonusMemberId(bonusMemberId === member.id ? null : member.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{bonusMemberId === member.id ? 'Close Bonus Box' : 'Award Point Bonus'}</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    Keep up the good work! 🌟
                  </span>
                )}

                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{member.streakDays} Day Streak</span>
                </div>
              </div>

              {/* Point Bonus Input Collapse (Mom Mode Only) */}
              {isMomMode && bonusMemberId === member.id && (
                <div className="mt-3 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Award Bonus Points to {member.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(Number(e.target.value))}
                      className="w-20 text-xs p-2 rounded-xl bg-white border border-indigo-300 font-bold text-indigo-900"
                    />
                    <input
                      type="text"
                      value={bonusReason}
                      onChange={(e) => setBonusReason(e.target.value)}
                      placeholder="Reason for reward..."
                      className="flex-1 text-xs p-2 rounded-xl bg-white border border-indigo-300 font-medium"
                    />
                    <button
                      onClick={() => handleGiveBonus(member.id)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
                    >
                      Give
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
