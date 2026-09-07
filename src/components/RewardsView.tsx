import React, { useState, useMemo } from 'react';
import { 
  Gift, 
  Plus, 
  Clock, 
  X, 
  Trash2, 
  Star, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Pencil, 
  Sparkles, 
  Filter, 
  RotateCcw,
  Tag,
  Gamepad2,
  Film,
  IceCream,
  DollarSign,
  Moon,
  Sparkle,
  Coffee,
  Ticket,
  Trophy,
  Tv,
  Smartphone,
  Music,
  ShoppingBag,
  Heart,
  Smile,
  Users
} from 'lucide-react';
import { RewardItem, RewardClaim, HouseholdMember } from '../types';
import { Avatar } from './Avatar';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { RewardModal } from './RewardModal';
import { RewardIconRenderer } from './RewardIconRenderer';

interface RewardsViewProps {
  rewards: RewardItem[];
  claims: RewardClaim[];
  members: HouseholdMember[];
  isMomMode: boolean;
  currentTheme?: ThemePreset;
  onClaimReward: (rewardId: string, memberId: string, note?: string) => void;
  onApproveClaim: (claimId: string, parentNote?: string) => void;
  onDeliverClaim: (claimId: string, parentNote?: string) => void;
  onRejectClaim?: (claimId: string, parentNote?: string) => void;
  onAddNewReward: (reward: Omit<RewardItem, 'id'>) => void;
  onUpdateReward?: (reward: RewardItem) => void;
  onDeleteReward: (rewardId: string) => void;
  onNavigateToRedemptions?: () => void;
  onOpenProgression?: () => void;
  onResetRewardsToDefault?: () => void;
}

type RewardCategory = 'all' | 'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege' | 'cosmetic';
type SortOption = 'featured' | 'points_asc' | 'points_desc' | 'name_asc' | 'closest_to_goal';

export const RewardsView: React.FC<RewardsViewProps> = ({
  rewards,
  claims,
  members,
  isMomMode,
  currentTheme = 'rose',
  onClaimReward,
  onApproveClaim,
  onDeliverClaim,
  onRejectClaim,
  onAddNewReward,
  onUpdateReward,
  onDeleteReward,
  onNavigateToRedemptions,
  onOpenProgression,
  onResetRewardsToDefault,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const isGlass = isGlassTheme(currentTheme);

  // Modal States
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardToEdit, setRewardToEdit] = useState<RewardItem | null>(null);
  const [claimModalReward, setClaimModalReward] = useState<RewardItem | null>(null);
  const [selectedClaimMemberId, setSelectedClaimMemberId] = useState<string>(
    members.find(m => m.role !== 'parent')?.id || members[0]?.id || ''
  );
  const [claimNote, setClaimNote] = useState<string>('');

  // Filtering & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('all');
  const [selectedFilterMemberId, setSelectedFilterMemberId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlyAffordable, setOnlyAffordable] = useState<boolean>(false);

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const activeMember = members.find(m => m.id === selectedFilterMemberId);

  // Helper info for categories
  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'screentime': 
        return { label: 'Screen Time', emoji: '🎮', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' };
      case 'activity': 
        return { label: 'Outing / Activity', emoji: '🎟️', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' };
      case 'treat': 
        return { label: 'Treat / Food', emoji: '🍦', badge: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800' };
      case 'allowance': 
        return { label: 'Allowance', emoji: '💵', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' };
      case 'privilege':
        return { label: 'Privilege', emoji: '🌟', badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' };
      case 'cosmetic':
        return { label: 'Cosmetic Frame', emoji: '✨', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800' };
      default: 
        return { label: cat, emoji: '🎁', badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  // Open Add Reward Modal
  const handleOpenAdd = () => {
    soundFX.playPop();
    setRewardToEdit(null);
    setIsRewardModalOpen(true);
  };

  // Open Edit Reward Modal
  const handleOpenEdit = (reward: RewardItem) => {
    soundFX.playPop();
    setRewardToEdit(reward);
    setIsRewardModalOpen(true);
  };

  // Save Reward handler (supports Add & Update)
  const handleSaveReward = (rewardData: Omit<RewardItem, 'id'>, existingId?: string) => {
    if (existingId && onUpdateReward) {
      onUpdateReward({
        ...rewardData,
        id: existingId,
      });
    } else {
      onAddNewReward(rewardData);
    }
    setIsRewardModalOpen(false);
    setRewardToEdit(null);
  };

  // Confirm claim redemption
  const handleConfirmClaim = () => {
    if (!claimModalReward || !selectedClaimMemberId) return;
    soundFX.playFanfare();
    onClaimReward(claimModalReward.id, selectedClaimMemberId, claimNote.trim() || undefined);
    setClaimModalReward(null);
    setClaimNote('');
  };

  // Category counts for quick scannability
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: rewards.length,
      treat: 0,
      screentime: 0,
      activity: 0,
      allowance: 0,
      privilege: 0,
      cosmetic: 0,
    };
    rewards.forEach(r => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    });
    return counts;
  }, [rewards]);

  // Count of affordable rewards for the active member
  const affordableCount = useMemo(() => {
    if (!activeMember) {
      const maxPts = Math.max(...members.filter(m => m.role !== 'parent').map(m => m.currentPoints), 0);
      return rewards.filter(r => r.pointCost <= maxPts).length;
    }
    return rewards.filter(r => r.pointCost <= activeMember.currentPoints).length;
  }, [rewards, activeMember, members]);

  // Filter & Sort Pipeline
  const filteredAndSortedRewards = useMemo(() => {
    let result = [...rewards];

    // 1. Search Query Filter (Title, Description, Category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(r => r.category === selectedCategory);
    }

    // 3. "Only Affordable" Filter
    if (onlyAffordable) {
      if (activeMember) {
        result = result.filter(r => activeMember.currentPoints >= r.pointCost);
      } else {
        const maxPts = Math.max(...members.filter(m => m.role !== 'parent').map(m => m.currentPoints), 0);
        result = result.filter(r => r.pointCost <= maxPts);
      }
    }

    // 4. Role eligibility filter (if member selected)
    if (activeMember && activeMember.role) {
      result = result.filter(r => {
        if (!r.allowedRoles || r.allowedRoles.length === 0) return true;
        return r.allowedRoles.includes(activeMember.role);
      });
    }

    // 5. Sorting
    switch (sortBy) {
      case 'points_asc':
        result.sort((a, b) => a.pointCost - b.pointCost);
        break;
      case 'points_desc':
        result.sort((a, b) => b.pointCost - a.pointCost);
        break;
      case 'name_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'closest_to_goal':
        if (activeMember) {
          result.sort((a, b) => {
            const needA = Math.max(0, a.pointCost - activeMember.currentPoints);
            const needB = Math.max(0, b.pointCost - activeMember.currentPoints);
            return needA - needB;
          });
        }
        break;
      case 'featured':
      default:
        // Keep catalog ordering
        break;
    }

    return result;
  }, [rewards, searchQuery, selectedCategory, onlyAffordable, activeMember, sortBy, members]);

  // Clear all filters
  const handleClearFilters = () => {
    soundFX.playPop();
    setSearchQuery('');
    setSelectedCategory('all');
    setOnlyAffordable(false);
    setSortBy('featured');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || onlyAffordable || sortBy !== 'featured';

  return (
    <div className="space-y-3 sm:space-y-5 pb-20 sm:pb-8">
      
      {/* 1. Header & Primary Action Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs flex items-center justify-between gap-3 min-w-0 ${
        isGlass 
          ? 'apple-glass-panel border-white/40' 
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
      }`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className={`text-lg sm:text-2xl font-black tracking-tight leading-tight truncate ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
              Rewards & Store
            </h1>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shrink-0">
              ⭐ {rewards.length} Items
            </span>
          </div>
          <p className={`text-[11px] sm:text-xs font-medium truncate ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
            Redeem chore points for perks, treats, allowance & privileges
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenProgression && (
            <button
              onClick={() => {
                soundFX.playPop();
                onOpenProgression();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all active:scale-95 cursor-pointer min-h-[40px] bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
              title="View Levels Roadmap & Cosmetics Locker"
            >
              <Trophy className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Journey & Levels</span>
              <span className="xs:hidden">Journey</span>
            </button>
          )}

          {isMomMode && onResetRewardsToDefault && (
            <button
              onClick={() => {
                onResetRewardsToDefault();
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer min-h-[40px] shrink-0 ${
                isGlass 
                  ? 'apple-glass-button text-slate-800 dark:text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Reset or restore all 23 Game Theory rewards across Levels 1–6"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Game Theory Pack</span>
            </button>
          )}

          {isMomMode && (
            <button
              onClick={handleOpenAdd}
              className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all active:scale-95 cursor-pointer min-h-[40px] shrink-0 ${
                isGlass 
                  ? 'apple-glass-button-primary' 
                  : `${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText}`
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Reward</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Deluxe Family Member Showcase & Points Hub (User Request: Nice Big Tiles with Glowing Cosmetics & Points) */}
      <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border transition-all ${
        isGlass 
          ? 'apple-glass-card border-white/25 text-slate-900 dark:text-white' 
          : `${theme.heroBannerBg} ${theme.heroBannerText} ${theme.heroBannerBorder} ${theme.heroBannerGlow}`
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider opacity-90 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Family Points Showcase</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white backdrop-blur-xs">
                Tap helper to filter store
              </span>
            </div>
            <p className="text-xs font-medium opacity-85 mt-0.5">
              {selectedFilterMemberId === 'all'
                ? 'Showing rewards for all family helpers. Tap any card below to view custom affordability!'
                : `Currently highlighting store items affordable for ${activeMember?.name || 'Helper'}`}
            </p>
          </div>

          {selectedFilterMemberId !== 'all' && (
            <button
              onClick={() => {
                soundFX.playPop();
                setSelectedFilterMemberId('all');
              }}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs hover:bg-slate-100 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Show All Kids</span>
            </button>
          )}
        </div>

        {/* Big Interactive Family Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
          {/* 1. All Helpers Master Tile */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setSelectedFilterMemberId('all');
            }}
            className={`group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer min-h-[160px] justify-between ${
              selectedFilterMemberId === 'all'
                ? 'bg-white text-slate-900 border-white shadow-lg ring-4 ring-white/30 scale-[1.02]'
                : isGlass
                  ? 'bg-white/25 hover:bg-white/35 text-slate-900 dark:text-white border-white/30 hover:border-white/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/35'
            }`}
          >
            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider opacity-80 mb-2">
              <span>Overview</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/15">All</span>
            </div>

            {/* Emblem Centerpiece */}
            <div className="my-1.5 relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 flex items-center justify-center text-2xl sm:text-3xl shadow-md group-hover:scale-105 transition-transform">
                👨‍👩‍👧‍👦
              </div>
            </div>

            {/* Title & Stats */}
            <div className="w-full mt-1">
              <div className="text-xs sm:text-sm font-black truncate">All Helpers</div>
              <div className={`mt-1.5 px-2 py-1 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${
                selectedFilterMemberId === 'all'
                  ? `${theme.primaryBg} ${theme.primaryText}`
                  : 'bg-black/25 text-white'
              }`}>
                <Gift className="w-3 h-3 text-amber-300" />
                <span>{rewards.length} Rewards</span>
              </div>
            </div>
          </button>

          {/* 2. Individual Family Member Tiles (Deluxe Size with Cosmetic Effects & Points) */}
          {members.filter(m => m.role !== 'parent').map((member) => {
            const isSelected = selectedFilterMemberId === member.id;
            const affordableCount = rewards.filter(r => r.pointCost <= member.currentPoints).length;
            const roleTitle = member.role === 'teen' ? 'Teen' : 'Helper';

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedFilterMemberId(isSelected ? 'all' : member.id);
                }}
                className={`group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all duration-300 cursor-pointer min-h-[160px] justify-between overflow-visible ${
                  isSelected
                    ? 'bg-white text-slate-900 border-amber-300 shadow-xl ring-4 ring-amber-400/40 scale-[1.02]'
                    : isGlass
                      ? 'bg-white/25 hover:bg-white/35 text-slate-900 dark:text-white border-white/30 hover:border-white/50'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/35'
                }`}
              >
                {/* Active Shopper Badge or Role Header */}
                <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                  <span className={`truncate max-w-[70px] ${isSelected ? 'text-amber-800 font-black' : 'opacity-85'}`}>
                    {member.age ? `Age ${member.age}` : roleTitle}
                  </span>
                  {isSelected ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black tracking-tight animate-pulse flex items-center gap-0.5 shadow-2xs">
                      Active
                    </span>
                  ) : member.streakDays && member.streakDays > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-amber-300 text-[10px] font-bold">
                      🔥 {member.streakDays}d
                    </span>
                  ) : null}
                </div>

                {/* Big Avatar Centerpiece with Spacious Margin for Wings & Crowns */}
                <div className="my-1.5 relative flex items-center justify-center p-2">
                  <Avatar
                    member={member}
                    photoUrl={member.avatarPhotoUrl}
                    emoji={member.avatarEmoji}
                    name={member.name}
                    size="xl"
                    showBorder={false}
                    className="transform transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Member Name & Points Hub */}
                <div className="w-full mt-1 space-y-1">
                  <div className="text-xs sm:text-sm font-black truncate max-w-full">
                    {member.name.split(' ')[0]}
                  </div>

                  {/* Deluxe Points Badge */}
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-500/50'
                      : 'bg-black/30 text-amber-300 border border-white/10'
                  }`}>
                    <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                    <span>{member.currentPoints} pts</span>
                  </div>

                  {/* Affordability micro-label */}
                  <div className={`text-[10px] font-bold truncate ${
                    isSelected ? 'text-slate-600' : 'opacity-80'
                  }`}>
                    {affordableCount > 0 
                      ? `${affordableCount} reward${affordableCount === 1 ? '' : 's'} ready` 
                      : 'Saving points'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Pending Claims Notice (if any) */}
      {pendingClaims.length > 0 && (
        <div className={`rounded-2xl border p-3 sm:p-4 shadow-2xs space-y-2.5 ${
          isGlass 
            ? 'apple-glass-card border-amber-200/50' 
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Pending Reward Redemptions ({pendingClaims.length})</span>
            </h3>
            {onNavigateToRedemptions && (
              <button
                onClick={() => {
                  soundFX.playPop();
                  onNavigateToRedemptions();
                }}
                className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer min-h-[34px] ${
                  isGlass 
                    ? 'bg-amber-200/60 text-amber-950 border border-amber-300/60 hover:bg-amber-200/80 shadow-xs' 
                    : 'text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800'
                }`}
              >
                <span>Manage All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {pendingClaims.slice(0, 3).map((claim) => (
              <div 
                key={claim.id} 
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xs ${
                  isGlass 
                    ? 'apple-glass-card border-amber-200/50' 
                    : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">{claim.memberName}</span>
                    <span className="text-[10px] font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded-md shrink-0">
                      ⭐ {claim.pointCost} pts
                    </span>
                  </div>
                  <p className={`text-[11px] font-medium ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} truncate mt-0.5`}>
                    {claim.rewardTitle}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isMomMode ? (
                    <button
                      onClick={() => {
                        soundFX.playComplete();
                        onApproveClaim(claim.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg active:scale-95 text-xs font-black shadow-2xs transition-all cursor-pointer min-h-[38px] flex items-center gap-1 ${
                        isGlass ? 'apple-glass-button-primary' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-lg">
                      Pending ⏳
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Apple HIG Compact Search, Filter & Sort Hub */}
      <div className={`p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border shadow-xs space-y-2 ${
        isGlass 
          ? 'apple-glass-panel border-white/40' 
          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
      }`}>
        
        {/* Row 1: Unified Search + Sort Segments/Select + Affordable Pill + Count */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* iOS Compact Search Input */}
          <div className="relative flex-1 min-w-[130px] sm:min-w-[170px] lg:max-w-md">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rewards, treats, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border font-medium min-h-[36px] sm:min-h-[38px] transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 ${
                isGlass 
                  ? 'apple-glass-input text-slate-900 dark:text-white placeholder-slate-400' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[26px] min-w-[26px] flex items-center justify-center rounded-lg active:scale-95"
                title="Clear search"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop & Tablet Segmented Sort Control */}
          <div className={`hidden md:inline-flex p-0.5 rounded-xl border shrink-0 items-center ${
            isGlass ? 'bg-white/20 border-white/30' : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
          }`}>
            {[
              { id: 'featured', label: 'Featured', icon: Sparkles },
              { id: 'points_asc', label: '⭐ Low', fullLabel: '⭐ Low → High', icon: ArrowUp },
              { id: 'points_desc', label: '⭐ High', fullLabel: '⭐ High → Low', icon: ArrowDown },
              { id: 'name_asc', label: 'A → Z', fullLabel: 'A → Z', icon: Tag },
              ...(activeMember ? [{ id: 'closest_to_goal', label: '🎯 Closest', fullLabel: '🎯 Closest', icon: SlidersHorizontal }] : [])
            ].map(opt => {
              const isSelected = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setSortBy(opt.id as SortOption);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer min-h-[30px] flex items-center gap-1 ${
                    isSelected
                      ? isGlass 
                        ? 'bg-white text-slate-900 shadow-xs font-black' 
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Sort by ${opt.fullLabel || opt.label}`}
                >
                  <span className="hidden xl:inline">{opt.fullLabel || opt.label}</span>
                  <span className="xl:hidden">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Sort Dropdown Selector */}
          <div className="relative md:hidden shrink-0">
            <select
              value={sortBy}
              onChange={(e) => {
                soundFX.playPop();
                setSortBy(e.target.value as SortOption);
              }}
              className={`pl-7 pr-6 py-1.5 text-xs font-bold rounded-xl border min-h-[36px] cursor-pointer appearance-none ${
                isGlass
                  ? 'apple-glass-pill bg-white/20 border-white/30 text-slate-900 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
              title="Sort rewards"
            >
              <option value="featured">✨ Featured</option>
              <option value="points_asc">⭐ Low → High</option>
              <option value="points_desc">⭐ High → Low</option>
              <option value="name_asc">🔤 A → Z</option>
              {activeMember && <option value="closest_to_goal">🎯 Closest to Goal</option>}
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Affordable Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setOnlyAffordable(!onlyAffordable);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border min-h-[36px] sm:min-h-[38px] flex items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
              onlyAffordable
                ? isGlass 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-black shadow-xs' 
                  : 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                : isGlass 
                  ? 'apple-glass-button text-slate-700 dark:text-slate-300' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={onlyAffordable ? "Show all rewards" : "Show rewards affordable right now"}
          >
            <span className="text-xs sm:text-sm">🟢</span>
            <span className="hidden sm:inline">Affordable</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              onlyAffordable ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {affordableCount}
            </span>
          </button>

          {/* Results Counter & Reset Action (Inline on Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0 ml-auto">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <strong className="text-slate-900 dark:text-white font-extrabold">{filteredAndSortedRewards.length}</strong>/{rewards.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Streamlined Category Filter Chips + Results Counter for Mobile */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none -mx-0.5 px-0.5 pt-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: 'All', emoji: '🎁' },
              { id: 'treat', label: 'Treats', emoji: '🍦' },
              { id: 'screentime', label: 'Screen Time', emoji: '🎮' },
              { id: 'activity', label: 'Outings', emoji: '🎟️' },
              { id: 'allowance', label: 'Allowance', emoji: '💵' },
              { id: 'privilege', label: 'Privileges', emoji: '🌟' },
              { id: 'cosmetic', label: 'Cosmetics', emoji: '✨' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundFX.playPop();
                    setSelectedCategory(cat.id as RewardCategory);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[32px] sm:min-h-[34px] active:scale-95 border ${
                    isSelected
                      ? isGlass 
                        ? 'bg-white text-slate-900 border-white shadow-xs font-black' 
                        : `${theme.primaryBg} ${theme.primaryText} border-transparent shadow-xs font-black`
                      : isGlass 
                        ? 'bg-white/20 border-white/30 text-slate-800 dark:text-slate-200 hover:bg-white/30' 
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isSelected 
                      ? 'bg-black/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Results count & reset for tablet/mobile */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0 ml-auto pl-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {filteredAndSortedRewards.length}/{rewards.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Rewards Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredAndSortedRewards.map((reward) => {
          const catInfo = getCategoryInfo(reward.category);
          
          // Check affordability for selected member
          const memberPoints = activeMember ? activeMember.currentPoints : 0;
          const memberLifetimeXp = activeMember ? (activeMember.lifetimePoints || activeMember.currentPoints || 0) : 99999;
          const reqLevel = reward.minLevel || 1;
          const isLevelLocked = activeMember ? (
            // Calculate activeMember's level: Lv.1:0, Lv.2:100, Lv.3:250, Lv.4:500, Lv.5:1000, Lv.6:2500
            (reqLevel === 2 && memberLifetimeXp < 100) ||
            (reqLevel === 3 && memberLifetimeXp < 250) ||
            (reqLevel === 4 && memberLifetimeXp < 500) ||
            (reqLevel === 5 && memberLifetimeXp < 1000) ||
            (reqLevel === 6 && memberLifetimeXp < 2500)
          ) : false;

          const canAfford = !activeMember || (memberPoints >= reward.pointCost && !isLevelLocked);
          const pointsNeeded = activeMember ? Math.max(0, reward.pointCost - memberPoints) : 0;
          const progressPercent = activeMember ? Math.min(100, Math.round((memberPoints / reward.pointCost) * 100)) : 100;

          // Rarity styling badge
          const rarityBadgeStyle = {
            jackpot: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs font-black animate-pulse',
            legendary: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-black',
            epic: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold',
            rare: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold',
            common: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          }[reward.rarity || 'common'];

          return (
            <div
              key={reward.id}
              className={`${
                isGlass ? 'apple-glass-card border-white/30' : theme.cardBg
              } rounded-2xl sm:rounded-3xl border ${
                isGlass ? 'border-white/30' : theme.cardBorder
              } p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group ${
                isLevelLocked ? 'opacity-75' : ''
              }`}
            >
              <div>
                {/* Card Header: Category, Level Req, Rarity & Point Cost Badges */}
                <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${catInfo.badge}`}>
                      <span>{catInfo.emoji}</span>
                      <span>{catInfo.label}</span>
                    </span>

                    {reqLevel > 1 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                        isLevelLocked 
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300' 
                          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        <span>{isLevelLocked ? '🔒' : '⭐'} Lv.{reqLevel}+</span>
                      </span>
                    )}

                    {reward.rarity && reward.rarity !== 'common' && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border ${rarityBadgeStyle}`}>
                        {reward.rarity}
                      </span>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-2xs flex items-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>{reward.pointCost} pts</span>
                  </span>
                </div>

                {/* Main Card Info with Prominent Apple Icon Squircle */}
                <div className="flex items-start gap-3 mb-2.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs text-sky-600 dark:text-sky-400 ${
                    isGlass 
                      ? 'bg-white/50 border-white/60' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <RewardIconRenderer 
                      icon={reward.icon} 
                      fallbackEmoji={catInfo.emoji} 
                      className="w-6 h-6 stroke-[2]"
                      size={24}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm sm:text-base font-black leading-snug break-words ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
                      {reward.title}
                    </h3>

                    {reward.description ? (
                      <p className={`text-[12px] ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'} mt-0.5 line-clamp-2 leading-relaxed`}>
                        {reward.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                        No special conditions
                      </p>
                    )}

                    {reward.saverBonus && (
                      <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold leading-tight">
                        <span className="shrink-0 text-xs">✨</span>
                        <span>{reward.saverBonus}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Affordability Progress Bar when a specific child is selected */}
                {activeMember && (
                  <div className={`my-3 p-2.5 rounded-xl border space-y-1.5 ${
                    isGlass 
                      ? 'bg-white/20 border-white/30' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'
                  }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold truncate ${isGlass ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {activeMember.name.split(' ')[0]}'s Progress:
                      </span>
                      <span className={`font-extrabold ${canAfford ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {canAfford ? 'Ready to Claim! 🎉' : `Need ${pointsNeeded} more pts`}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden ${isGlass ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${canAfford ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Strip */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
                {/* Redeem Button */}
                <button
                  onClick={() => {
                    soundFX.playPop();
                    if (activeMember) {
                      setSelectedClaimMemberId(activeMember.id);
                    }
                    setClaimModalReward(reward);
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer min-h-[44px] touch-target active:scale-95 ${
                    isGlass && canAfford ? 'apple-glass-button-primary' : isGlass && !canAfford ? 'apple-glass-button opacity-70' :
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                      : isLevelLocked
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {isLevelLocked 
                      ? `Locked (Requires Lv.${reqLevel})` 
                      : canAfford 
                        ? 'Redeem Reward' 
                        : 'Check Requirements'}
                  </span>
                </button>

                {/* Mom / Admin Mode Quick Actions (Edit & Delete) */}
                {isMomMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(reward)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isGlass 
                          ? 'apple-glass-button' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                      title="Edit Reward"
                      aria-label={`Edit ${reward.title}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${reward.title}" from rewards catalog?`)) {
                          soundFX.playPop();
                          onDeleteReward(reward.id);
                        }
                      }}
                      className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Delete Reward"
                      aria-label={`Delete ${reward.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when no rewards match filter */}
      {filteredAndSortedRewards.length === 0 && (
        <div className={`text-center py-12 px-4 rounded-3xl border ${
          isGlass 
            ? 'apple-glass-card border-white/30' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl">
            🎁
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            No rewards match your search
          </h3>
          <p className={`text-xs ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'} mt-1 max-w-sm mx-auto`}>
            {searchQuery 
              ? `No rewards found matching "${searchQuery}". Try a different keyword.` 
              : 'Try clearing your category or affordability filters, or add a brand new reward.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={handleClearFilters}
              className={`px-4 py-2 rounded-xl text-xs font-black min-h-[40px] cursor-pointer transition-all border ${
                isGlass 
                  ? 'apple-glass-button' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Reset All Filters
            </button>
            {isMomMode && (
              <button
                onClick={handleOpenAdd}
                className={`px-4 py-2 rounded-xl text-xs font-black min-h-[40px] cursor-pointer transition-all ${
                  isGlass 
                    ? 'apple-glass-button-primary' 
                    : `${theme.primaryBg} ${theme.primaryText}`
                }`}
              >
                + Create New Reward
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. Apple-style Kid-Friendly Guide Banner */}
      <div className={`rounded-3xl border p-4 sm:p-5 shadow-xs space-y-3 ${
        isGlass 
          ? 'apple-glass-card border-indigo-200/50' 
          : 'bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-amber-50/50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 border-indigo-100 dark:border-slate-700/80'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            💡
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-black ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
              How to Earn Star Points Faster
            </h3>
            <p className={`text-[11px] ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'} font-medium`}>
              Finish household chores on time with top inspection quality to afford everything in the store!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className={`p-3 rounded-2xl border space-y-1 ${
            isGlass ? 'bg-white/20 border-indigo-200/50' : 'bg-white/80 dark:bg-slate-900/80 border-indigo-100/80 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-700 dark:text-emerald-300">🌟 Top Quality (A+)</span>
              <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">100% Pts</span>
            </div>
            <p className={`text-[11px] ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} leading-snug`}>
              Complete all checklist items & upload clean photo proof to earn full points.
            </p>
          </div>

          <div className={`p-3 rounded-2xl border space-y-1 ${
            isGlass ? 'bg-white/20 border-amber-200/50' : 'bg-white/80 dark:bg-slate-900/80 border-amber-100/80 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-700 dark:text-amber-300">⏰ On-Time Bonus</span>
              <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md">Zero Penalty</span>
            </div>
            <p className={`text-[11px] ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} leading-snug`}>
              Finish chores before bedtime to keep 100% of points without deductions.
            </p>
          </div>

          <div className={`p-3 rounded-2xl border space-y-1 ${
            isGlass ? 'bg-white/20 border-purple-200/50' : 'bg-white/80 dark:bg-slate-900/80 border-purple-100/80 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-700 dark:text-purple-300">🔄 Quick Redos</span>
              <span className="text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded-md">Full Recovery</span>
            </div>
            <p className={`text-[11px] ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} leading-snug`}>
              If inspection requests a redo, fix the missing item immediately to regain points!
            </p>
          </div>
        </div>
      </div>

      {/* 7. Claim Redemption Modal - Apple HIG Sheet */}
      {claimModalReward && (
        <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${
          isGlass ? 'backdrop-blur-md bg-slate-900/30' : 'bg-slate-900/60'
        }`}>
          <div 
            className="fixed inset-0" 
            onClick={() => setClaimModalReward(null)} 
            aria-hidden="true"
          />
          <div className={`relative rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border space-y-3.5 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto safe-area-pb z-10 ${
            isGlass 
              ? 'apple-glass-panel border-white/40' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 bg-white/10 dark:bg-black/10 rounded-t-3xl -mx-4 -mt-4 sm:hidden">
              <BottomSheetGrabber onClose={() => setClaimModalReward(null)} variant={isGlass ? 'white' : 'default'} />
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Claim Reward</h3>
                <p className={`text-xs ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'} font-medium`}>
                  Request redemption from family store
                </p>
              </div>
              <button 
                onClick={() => setClaimModalReward(null)} 
                className={`p-1.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                  isGlass ? 'text-slate-700 hover:bg-white/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isGlass ? 'apple-glass-card border-amber-300/40' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex justify-center mb-1.5 text-sky-600 dark:text-sky-400">
                <RewardIconRenderer 
                  icon={claimModalReward.icon} 
                  fallbackEmoji="🎁" 
                  className="w-8 h-8 stroke-[2]"
                  size={32}
                />
              </div>
              <h4 className="text-sm font-black text-amber-950 dark:text-amber-100">{claimModalReward.title}</h4>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-0.5">Cost: {claimModalReward.pointCost} Points</p>
            </div>

            <div>
              <label className={`block text-[11px] font-black ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} uppercase tracking-wider mb-2`}>
                Who is claiming this reward?
              </label>
              <div className="space-y-1.5">
                {members.filter(m => m.role !== 'parent').map((m) => {
                  const hasEnough = m.currentPoints >= claimModalReward.pointCost;
                  const isSelected = selectedClaimMemberId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!hasEnough}
                      onClick={() => {
                        soundFX.playPop();
                        setSelectedClaimMemberId(m.id);
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer min-h-[44px] ${
                        !hasEnough 
                          ? (isGlass ? 'opacity-50 apple-glass-input cursor-not-allowed' : 'opacity-50 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed')
                          : isSelected
                            ? (isGlass ? 'apple-glass-card border-amber-400/60 ring-2 ring-amber-400/20 bg-amber-500/10' : 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20')
                            : (isGlass ? 'apple-glass-card border-white/40 text-slate-900 dark:text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750')
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar member={m} photoUrl={m.avatarPhotoUrl} emoji={m.avatarEmoji} name={m.name} size="sm" showBorder={false} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-black ${hasEnough ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'}`}>
                          {m.currentPoints} pts
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isGlass ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} mb-1`}>
                Note for Mom (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Can we do this on Friday night?"
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                className={`w-full text-xs sm:text-sm p-2.5 rounded-xl border font-medium focus:ring-2 focus:ring-amber-500 transition-all min-h-[42px] ${
                  isGlass ? 'apple-glass-input' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              />
            </div>

            <div className="pt-2 flex gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClaimModalReward(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold min-h-[44px] cursor-pointer ${
                  isGlass ? 'apple-glass-button border-transparent hover:border-white/20 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                disabled={!selectedClaimMemberId || (members.find(m => m.id === selectedClaimMemberId)?.currentPoints || 0) < claimModalReward.pointCost}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 shadow-2xs cursor-pointer min-h-[44px] disabled:opacity-50 ${
                  isGlass ? 'apple-glass-button-primary' : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Apple HIG Unified Add & Edit Reward Modal */}
      <RewardModal
        isOpen={isRewardModalOpen}
        onClose={() => {
          setIsRewardModalOpen(false);
          setRewardToEdit(null);
        }}
        rewardToEdit={rewardToEdit}
        members={members}
        currentTheme={currentTheme}
        onSaveReward={handleSaveReward}
        onDeleteReward={onDeleteReward}
      />

    </div>
  );
};
