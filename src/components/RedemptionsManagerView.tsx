import React, { useState, useRef, useMemo } from 'react';
import { 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Check, 
  X, 
  Filter, 
  ChevronRight, 
  DollarSign, 
  Trash2, 
  RotateCcw, 
  Search, 
  PackageCheck, 
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  History,
  SlidersHorizontal,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { RewardClaim, HouseholdMember, RewardItem } from '../types';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { formatDisplayDate, formatTimeDisplay } from '../utils/storage';
import { ThemePreset, THEMES } from '../utils/theme';

interface RedemptionsManagerViewProps {
  claims: RewardClaim[];
  rewards: RewardItem[];
  members: HouseholdMember[];
  isMomMode: boolean;
  currentTheme?: ThemePreset;
  onApproveClaim: (claimId: string, parentNote?: string) => void;
  onDeliverClaim: (claimId: string, parentNote?: string) => void;
  onRejectClaim: (claimId: string, parentNote?: string) => void;
  onDeleteClaim: (claimId: string) => void;
  onNavigateToRewards?: () => void;
}

type TabType = 'pending' | 'approved' | 'delivered' | 'all';
const SWIPE_THRESHOLD = 75;

export const RedemptionsManagerView: React.FC<RedemptionsManagerViewProps> = ({
  claims,
  rewards,
  members,
  isMomMode,
  currentTheme = 'rose',
  onApproveClaim,
  onDeliverClaim,
  onRejectClaim,
  onDeleteClaim,
  onNavigateToRewards,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Note dialog modal state
  const [noteModalClaim, setNoteModalClaim] = useState<RewardClaim | null>(null);
  const [noteActionType, setNoteActionType] = useState<'approve' | 'deliver' | 'reject'>('approve');
  const [parentNoteInput, setParentNoteInput] = useState<string>('');

  // Mobile Touch & Swipe handling with Apple HIG Spring Physics
  const [swipingClaimId, setSwipingClaimId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<{ [claimId: string]: number }>({});
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  const theme = THEMES[currentTheme] || THEMES.rose;

  const triggerHaptic = (duration: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  };

  // Status counters
  const pendingCount = useMemo(() => claims.filter(c => c.status === 'pending').length, [claims]);
  const approvedCount = useMemo(() => claims.filter(c => c.status === 'approved').length, [claims]);
  const deliveredCount = useMemo(() => claims.filter(c => c.status === 'delivered').length, [claims]);

  // Filtered claims based on active filters
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Tab filter
      if (activeTab !== 'all' && claim.status !== activeTab) {
        return false;
      }
      // Member filter
      if (selectedMemberFilter !== 'all' && claim.memberId !== selectedMemberFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = claim.rewardTitle.toLowerCase().includes(q);
        const matchesMember = claim.memberName.toLowerCase().includes(q);
        const matchesNote = claim.note?.toLowerCase().includes(q) || claim.parentNote?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMember && !matchesNote) return false;
      }
      return true;
    });
  }, [claims, activeTab, selectedMemberFilter, searchQuery]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent, claimId: string) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
    setSwipingClaimId(claimId);
  };

  const handleTouchMove = (e: React.TouchEvent, claimId: string) => {
    if (swipingClaimId !== claimId) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect gesture direction
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(diffY) > 10) {
        isHorizontalSwipeRef.current = false;
        return;
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    // Dampened spring resistance
    let damped = diffX;
    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      const excess = Math.abs(diffX) - SWIPE_THRESHOLD;
      damped = Math.sign(diffX) * (SWIPE_THRESHOLD + excess * 0.35);
    }
    damped = Math.max(-130, Math.min(130, damped));

    // Tactile snap
    if (Math.abs(damped) >= SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = true;
      triggerHaptic([15, 30]);
      soundFX.playPop();
    } else if (Math.abs(damped) < SWIPE_THRESHOLD && hasTriggeredHapticRef.current) {
      hasTriggeredHapticRef.current = false;
    }

    setDragOffsets(prev => ({ ...prev, [claimId]: damped }));
  };

  const handleTouchEnd = (claim: RewardClaim) => {
    const offset = dragOffsets[claim.id] || 0;

    if (isHorizontalSwipeRef.current) {
      if (offset >= SWIPE_THRESHOLD) {
        // Swipe Right: Quick Advance Status (Pending -> Approve, Approved -> Deliver)
        triggerHaptic([20, 40, 20]);
        if (claim.status === 'pending') {
          soundFX.playRewardCoin();
          onApproveClaim(claim.id);
        } else if (claim.status === 'approved') {
          soundFX.playFanfare();
          onDeliverClaim(claim.id);
        }
      } else if (offset <= -SWIPE_THRESHOLD) {
        // Swipe Left: Action Menu / Reject or Refund
        triggerHaptic(20);
        soundFX.playPop();
        if (claim.status === 'pending') {
          openActionModal(claim, 'reject');
        } else {
          openActionModal(claim, 'deliver');
        }
      }
    }

    setDragOffsets(prev => ({ ...prev, [claim.id]: 0 }));
    setSwipingClaimId(null);
    isHorizontalSwipeRef.current = null;
    hasTriggeredHapticRef.current = false;
  };

  const openActionModal = (claim: RewardClaim, actionType: 'approve' | 'deliver' | 'reject') => {
    setNoteModalClaim(claim);
    setNoteActionType(actionType);
    setParentNoteInput(claim.parentNote || '');
  };

  const handleConfirmActionModal = () => {
    if (!noteModalClaim) return;
    const note = parentNoteInput.trim() || undefined;

    if (noteActionType === 'approve') {
      onApproveClaim(noteModalClaim.id, note);
    } else if (noteActionType === 'deliver') {
      onDeliverClaim(noteModalClaim.id, note);
    } else if (noteActionType === 'reject') {
      onRejectClaim(noteModalClaim.id, note);
    }

    setNoteModalClaim(null);
  };

  const getStatusBadge = (status: RewardClaim['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Approval',
          color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          icon: Clock,
          emoji: '⏳',
        };
      case 'approved':
        return {
          label: 'Approved (Ready to Enjoy)',
          color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
          icon: Sparkles,
          emoji: '🎉',
        };
      case 'delivered':
        return {
          label: 'Fulfilled & Delivered',
          color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          icon: CheckCircle2,
          emoji: '🎁',
        };
      case 'rejected':
        return {
          label: 'Returned & Refunded',
          color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700',
          icon: RotateCcw,
          emoji: '↩️',
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200',
          icon: Clock,
          emoji: '📌',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto pb-16 sm:pb-8">
      
      {/* 1. APPLE INSET HERO BANNER (Information Architecture) */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-slate-100 dark:from-emerald-950/30 dark:to-slate-900 rounded-3xl border border-emerald-200/70 dark:border-slate-800 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-600/20">
                🎁
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Redemptions Tracker
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border transition-colors ${
                    pendingCount > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}>
                    {pendingCount > 0 ? `${pendingCount} Waiting for Mom's Review` : 'All Rewards Fulfilled ✨'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    • {claims.length} total history
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Switch to Store Catalog */}
          {onNavigateToRewards && (
            <button
              onClick={() => {
                soundFX.playPop();
                onNavigateToRewards();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto min-h-[40px]"
            >
              <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Browse Rewards Store</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-emerald-200/50 dark:border-slate-800/80">
          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('pending');
            }}
            className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer active:scale-95 ${
              activeTab === 'pending'
                ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <span>Pending</span>
              <span>⏳</span>
            </div>
            <p className="text-lg sm:text-2xl font-black text-amber-950 dark:text-amber-100 mt-0.5">
              {pendingCount}
            </p>
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('approved');
            }}
            className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer active:scale-95 ${
              activeTab === 'approved'
                ? 'bg-blue-100/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
              <span>Approved</span>
              <span>🎉</span>
            </div>
            <p className="text-lg sm:text-2xl font-black text-blue-950 dark:text-blue-100 mt-0.5">
              {approvedCount}
            </p>
          </button>

          <button
            onClick={() => {
              soundFX.playPop();
              setActiveTab('delivered');
            }}
            className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer active:scale-95 ${
              activeTab === 'delivered'
                ? 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-400/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <span>Delivered</span>
              <span>🎁</span>
            </div>
            <p className="text-lg sm:text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
              {deliveredCount}
            </p>
          </button>
        </div>
      </div>

      {/* 2. CONTROLS BAR: Segmented Status Tabs & Family Member Filter */}
      <div className="space-y-2.5">
        
        {/* iOS Segmented Tabs Controller */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-700 shadow-2xs overflow-x-auto scrollbar-none">
            {[
              { id: 'pending' as TabType, label: 'Pending', count: pendingCount, icon: Clock },
              { id: 'approved' as TabType, label: 'Approved', count: approvedCount, icon: Sparkles },
              { id: 'delivered' as TabType, label: 'Delivered', count: deliveredCount, icon: CheckCircle2 },
              { id: 'all' as TabType, label: 'All History', count: claims.length, icon: Layers },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFX.playPop();
                    triggerHaptic(10);
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px] ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input for Quick Lookup */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reward or helper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Member Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1">
          <button
            onClick={() => {
              soundFX.playPop();
              setSelectedMemberFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
              selectedMemberFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs font-black'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>👨‍👩‍👧‍👦 All Kids</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              selectedMemberFilter === 'all'
                ? 'bg-slate-800 text-slate-200'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {claims.length}
            </span>
          </button>

          {members.filter(m => m.role !== 'parent').map((member) => {
            const count = claims.filter(c => c.memberId === member.id).length;
            const isSelected = selectedMemberFilter === member.id;
            return (
              <button
                key={member.id}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedMemberFilter(member.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs font-black'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Avatar
                  photoUrl={member.avatarPhotoUrl}
                  emoji={member.avatarEmoji}
                  name={member.name}
                  size="xs"
                  showBorder={false}
                />
                <span>{member.name.split(' ')[0]}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. REDEMPTION CLAIMS FEED */}
      {filteredClaims.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center text-3xl mb-3 shadow-2xs">
            🎁
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
            No Redemptions Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {activeTab === 'pending'
              ? 'Great news! There are no reward redemption requests waiting for approval right now.'
              : 'No redemption history matches the selected tab and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredClaims.map((claim) => {
            const member = members.find(m => m.id === claim.memberId);
            const statusInfo = getStatusBadge(claim.status);
            const StatusIcon = statusInfo.icon;
            
            const currentOffset = dragOffsets[claim.id] || 0;
            const isSwipingThis = swipingClaimId === claim.id;
            const isSwipeRight = currentOffset > 15;
            const isSwipeLeft = currentOffset < -15;
            const isThresholdMetRight = currentOffset >= SWIPE_THRESHOLD;
            const isThresholdMetLeft = currentOffset <= -SWIPE_THRESHOLD;

            return (
              <div
                key={claim.id}
                id={`claim-card-${claim.id}`}
                className="relative rounded-3xl overflow-hidden shadow-2xs select-none touch-pan-y"
              >
                {/* Background Swipe Actions Layer (Apple HIG Spring Physics) */}
                <div 
                  className={`absolute inset-0 flex items-center justify-between px-5 font-black text-xs transition-colors duration-200 rounded-3xl ${
                    isSwipeRight
                      ? isThresholdMetRight 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-500 text-white'
                      : isSwipeLeft
                      ? isThresholdMetLeft 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-rose-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {/* Left: Swipe Right to Advance */}
                  <div className={`flex items-center gap-2 transition-all ${
                    isSwipeRight ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="uppercase tracking-wider font-black">
                      {claim.status === 'pending'
                        ? (isThresholdMetRight ? 'Release: Approve Claim! 🎉' : 'Swipe: Approve')
                        : claim.status === 'approved'
                        ? (isThresholdMetRight ? 'Release: Mark Delivered! 🎁' : 'Swipe: Deliver')
                        : 'Fulfilled'}
                    </span>
                  </div>

                  {/* Right: Swipe Left to Reject or Add Note */}
                  <div className={`flex items-center gap-2 transition-all ml-auto ${
                    isSwipeLeft ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}>
                    <span className="uppercase tracking-wider font-black">
                      {claim.status === 'pending'
                        ? (isThresholdMetLeft ? 'Release: Refund Points ↩️' : 'Swipe: Refund')
                        : (isThresholdMetLeft ? 'Release: Note / Actions' : 'Swipe: Options')}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Foreground Interactive Inset Card */}
                <div
                  onTouchStart={(e) => handleTouchStart(e, claim.id)}
                  onTouchMove={(e) => handleTouchMove(e, claim.id)}
                  onTouchEnd={() => handleTouchEnd(claim)}
                  style={{
                    transform: `translateX(${currentOffset}px)`,
                    transition: isSwipingThis ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
                  }}
                  className={`relative z-10 bg-white dark:bg-slate-900 rounded-3xl border p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between ${
                    claim.status === 'pending'
                      ? 'border-amber-300 dark:border-amber-800'
                      : claim.status === 'approved'
                      ? 'border-blue-300 dark:border-blue-800'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Top Meta Strip: Helper, Date, Cost Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          photoUrl={member?.avatarPhotoUrl}
                          emoji={member?.avatarEmoji || '👤'}
                          name={claim.memberName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                            {claim.memberName}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                            Requested {formatDisplayDate(claim.claimedAt.split('T')[0])} {formatTimeDisplay(claim.claimedAt.split('T')[1]?.substring(0, 5))}
                          </span>
                        </div>
                      </div>

                      {/* Point Cost & Status Badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-2xs flex items-center gap-1">
                          ⭐ {claim.pointCost} pts
                        </span>
                        
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border flex items-center gap-1 ${statusInfo.color}`}>
                          <span>{statusInfo.emoji}</span>
                          <span className="hidden sm:inline">{statusInfo.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Reward Title */}
                    <div className="my-1.5">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                        {claim.rewardTitle}
                      </h3>
                    </div>

                    {/* Helper's Request Note or Mom's Response Note */}
                    {claim.note && (
                      <div className="mt-2 p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200/70 dark:border-amber-900/50">
                        <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>{claim.memberName.split(' ')[0]}'s Request Note:</span>
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-200 italic leading-snug">
                          "{claim.note}"
                        </p>
                      </div>
                    )}

                    {claim.parentNote && (
                      <div className="mt-2 p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50">
                        <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1 mb-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mom's Note:</span>
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 italic leading-snug">
                          "{claim.parentNote}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-3">
                    
                    {/* Mobile Gestures Guidance */}
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:flex items-center gap-1.5">
                      <span>👉 Swipe to approve</span>
                      <span>•</span>
                      <span>👈 Swipe to refund</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                      
                      {/* PENDING ACTIONS */}
                      {claim.status === 'pending' && isMomMode && (
                        <>
                          <button
                            onClick={() => openActionModal(claim, 'reject')}
                            className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund Points</span>
                          </button>

                          <button
                            onClick={() => {
                              soundFX.playRewardCoin();
                              triggerHaptic(20);
                              onApproveClaim(claim.id);
                            }}
                            className="flex-1 sm:flex-initial min-h-[40px] px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Request</span>
                          </button>
                        </>
                      )}

                      {/* APPROVED ACTIONS */}
                      {claim.status === 'approved' && isMomMode && (
                        <>
                          <button
                            onClick={() => openActionModal(claim, 'deliver')}
                            className="flex-1 sm:flex-initial min-h-[40px] px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Mark as Delivered 🎁</span>
                          </button>
                        </>
                      )}

                      {/* DELIVERED ACTIONS */}
                      {claim.status === 'delivered' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered to {claim.memberName}</span>
                          </span>

                          {isMomMode && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete record of "${claim.rewardTitle}" from history?`)) {
                                  soundFX.playPop();
                                  onDeleteClaim(claim.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                              title="Delete Claim Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* REJECTED / REFUNDED ACTIONS */}
                      {claim.status === 'rejected' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <span>Points Refunded</span>
                          </span>

                          {isMomMode && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete record of "${claim.rewardTitle}"?`)) {
                                  soundFX.playPop();
                                  onDeleteClaim(claim.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MOM ACTION MODAL (Bottom Sheet for Mobile, Centered for Desktop) */}
      {noteModalClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setNoteModalClaim(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom duration-200 z-10 max-h-[90vh] overflow-y-auto safe-area-pb">
            
            {/* iOS Drag Handle */}
            <div className="sm:hidden pt-1 pb-0.5 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {noteActionType === 'approve'
                    ? 'Approve Reward Claim'
                    : noteActionType === 'deliver'
                    ? 'Confirm Reward Delivery'
                    : 'Refund Points & Decline'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {noteModalClaim.rewardTitle} • {noteModalClaim.memberName}
                </p>
              </div>
              <button 
                onClick={() => setNoteModalClaim(null)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Refund notice */}
            {noteActionType === 'reject' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Refund {noteModalClaim.pointCost} Points</span>
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  {noteModalClaim.pointCost} points will be credited back to {noteModalClaim.memberName}'s balance immediately.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Note for {noteModalClaim.memberName} (Optional)
              </label>
              <textarea
                rows={3}
                placeholder={
                  noteActionType === 'deliver'
                    ? 'e.g. Handed ice cream voucher on Friday night!'
                    : noteActionType === 'reject'
                    ? 'e.g. Let us save up together for the big weekend trip instead!'
                    : 'e.g. Approved! You earned it with great teamwork this week.'
                }
                value={parentNoteInput}
                onChange={(e) => setParentNoteInput(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalClaim(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px] cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmActionModal}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-2xs min-h-[40px] cursor-pointer active:scale-95 transition-all ${
                  noteActionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {noteActionType === 'reject' ? 'Confirm Refund' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
