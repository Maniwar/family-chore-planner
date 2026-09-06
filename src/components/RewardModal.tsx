import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Gift, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { RewardItem, HouseholdMember, MemberRole } from '../types';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { Avatar } from './Avatar';
import { RewardIconRenderer } from './RewardIconRenderer';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: RewardItem | null;
  members: HouseholdMember[];
  currentTheme?: ThemePreset;
  onSaveReward: (rewardData: Omit<RewardItem, 'id'>, existingId?: string) => void;
  onDeleteReward?: (rewardId: string) => void;
}

const POPULAR_EMOJIS = [
  '🎁', '🍦', '🎮', '🎟️', '💵', '🌟', 
  '🍕', '🎬', '🎳', '📱', '🚲', '🧸', 
  '🍩', '🧁', '🏊', '🛹', '⛺', '🎧', 
  '🐾', '📚', '🎯', '🎨', '🏖️', '🚗'
];

const PRESET_POINTS = [50, 85, 120, 200, 375, 575, 1100, 2100];

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  rewardToEdit,
  members,
  currentTheme = 'rose',
  onSaveReward,
  onDeleteReward,
}) => {
  const isEditing = Boolean(rewardToEdit);
  const theme = THEMES[currentTheme] || THEMES.rose;
  const isGlass = isGlassTheme(currentTheme);

  // Form State
  const [title, setTitle] = useState('');
  const [pointCost, setPointCost] = useState<number>(100);
  const [category, setCategory] = useState<'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege' | 'cosmetic'>('treat');
  const [icon, setIcon] = useState('🎁');
  const [description, setDescription] = useState('');
  const [allowedRoles, setAllowedRoles] = useState<MemberRole[]>(['child', 'teen']);
  const [minLevel, setMinLevel] = useState<number>(1);
  const [rarity, setRarity] = useState<'common' | 'rare' | 'epic' | 'legendary' | 'jackpot'>('common');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Bottom Sheet hook for mobile swipe-to-dismiss
  const { sheetStyle, handleDismiss, dragHandleProps } = useBottomSheet({ 
    onClose: () => {
      setShowConfirmDelete(false);
      onClose();
    }
  });

  // Populate fields when editing or opening
  useEffect(() => {
    if (rewardToEdit) {
      setTitle(rewardToEdit.title || '');
      setPointCost(rewardToEdit.pointCost || 50);
      setCategory(rewardToEdit.category || 'treat');
      setIcon(rewardToEdit.icon || '🎁');
      setDescription(rewardToEdit.description || '');
      setMinLevel(rewardToEdit.minLevel || 1);
      setRarity(rewardToEdit.rarity || 'common');
      setAllowedRoles(rewardToEdit.allowedRoles && rewardToEdit.allowedRoles.length > 0 
        ? rewardToEdit.allowedRoles 
        : ['child', 'teen']
      );
    } else {
      setTitle('');
      setPointCost(50);
      setCategory('treat');
      setIcon('🎁');
      setDescription('');
      setMinLevel(1);
      setRarity('common');
      setAllowedRoles(['child', 'teen']);
    }
    setShowConfirmDelete(false);
  }, [rewardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundFX.playPop();
    onSaveReward(
      {
        title: title.trim(),
        pointCost: Math.max(5, Math.min(10000, Number(pointCost) || 50)),
        category,
        icon: icon || '🎁',
        description: description.trim(),
        allowedRoles,
        minLevel,
        rarity,
      },
      rewardToEdit?.id
    );

    handleDismiss();
  };

  const handleAdjustPoints = (delta: number) => {
    soundFX.playPop();
    setPointCost(prev => Math.max(5, Math.min(10000, prev + delta)));
  };

  const handleDelete = () => {
    if (!rewardToEdit || !onDeleteReward) return;
    soundFX.playPop();
    onDeleteReward(rewardToEdit.id);
    handleDismiss();
  };

  const kidsAndTeens = members.filter(m => m.role !== 'parent');

  return (
    <div 
      className={`fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 ${
        isGlass ? 'backdrop-blur-md bg-slate-900/30' : 'bg-slate-900/60'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={handleDismiss} 
        aria-hidden="true"
      />

      {/* Sheet / Dialog Box */}
      <div 
        style={sheetStyle}
        className={`relative rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border flex flex-col animate-in slide-in-from-bottom duration-200 max-h-[92vh] z-10 ${
          isGlass 
            ? 'apple-glass-panel border-white/40 shadow-2xl' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* iOS Drag Handle (Mobile only) */}
        <div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 bg-white/10 dark:bg-black/10 rounded-t-3xl sm:hidden">
          <BottomSheetGrabber 
            dragHandleProps={dragHandleProps} 
            onClose={handleDismiss} 
            variant={isGlass ? 'white' : 'default'} 
          />
        </div>

        {/* Modal Navigation Bar (Apple HIG Style) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className={`text-xs sm:text-sm font-semibold px-2 py-1.5 rounded-lg transition-all min-h-[38px] flex items-center cursor-pointer ${
              isGlass 
                ? 'text-slate-800 hover:text-slate-950 dark:text-slate-200 hover:bg-white/20' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>

          <div className="text-center px-2">
            <h2 className={`text-sm sm:text-base font-black tracking-tight ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
              {isEditing ? 'Edit Reward' : 'New Reward'}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {isEditing ? 'Update reward perks & cost' : 'Add to family reward store'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={`text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl transition-all shadow-xs min-h-[38px] flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isGlass 
                ? 'apple-glass-button-primary' 
                : `${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText}`
            }`}
          >
            {isEditing ? 'Save' : 'Add'}
          </button>
        </div>

        {/* Form Body - Inset Grouped Sections */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto safe-area-pb space-y-4">
          
          {/* Header Preview & Icon Picker Banner */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3.5 ${
            isGlass ? 'apple-glass-card border-white/30' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
          }`}>
            <div className="relative shrink-0">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm border text-sky-600 dark:text-sky-400 ${
                isGlass 
                  ? 'bg-white/50 border-white/60 shadow-xs' 
                  : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
              }`}>
                <RewardIconRenderer icon={icon} fallbackEmoji="🎁" className="w-7 h-7 stroke-[2]" size={28} />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                ⭐ {pointCost}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Reward Preview
              </span>
              <p className={`text-sm sm:text-base font-extrabold truncate ${theme.appTextClass || 'text-slate-900 dark:text-white'}`}>
                {title.trim() || 'Untitled Reward'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                Category: <strong className="font-semibold text-slate-700 dark:text-slate-300">{category}</strong>
              </p>
            </div>
          </div>

          {/* Group 1: General Information */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
            isGlass ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
          }`}>
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Reward Details
            </h3>

            {/* Title Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reward Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1 Hour Video Game Pass, Friday Ice Cream"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full text-sm sm:text-base p-2.5 sm:p-3 rounded-xl border font-semibold min-h-[44px] transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 ${
                  isGlass 
                    ? 'apple-glass-input text-slate-900 dark:text-white placeholder-slate-400' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
                }`}
              />
            </div>

            {/* Category Segmented Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Reward Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: 'treat', label: 'Treats & Snacks', emoji: '🍦' },
                  { id: 'screentime', label: 'Screen Time', emoji: '🎮' },
                  { id: 'activity', label: 'Outing & Event', emoji: '🎟️' },
                  { id: 'allowance', label: 'Cash Allowance', emoji: '💵' },
                  { id: 'privilege', label: 'Special Privilege', emoji: '🌟' },
                  { id: 'cosmetic', label: 'Avatar Cosmetic', emoji: '✨' },
                ].map(item => {
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setCategory(item.id as any);
                        if (icon === '🎁' || icon === '🍦' || icon === '🎮' || icon === '🎟️' || icon === '💵' || icon === '🌟' || icon === '✨') {
                          setIcon(item.emoji);
                        }
                      }}
                      className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all border min-h-[42px] cursor-pointer text-left active:scale-98 ${
                        isSelected
                          ? isGlass 
                            ? 'bg-white/80 border-white text-slate-900 shadow-xs font-black ring-1 ring-white/60' 
                            : `${theme.primaryBg} text-white border-transparent shadow-xs font-black`
                          : isGlass 
                            ? 'bg-white/25 border-white/35 text-slate-800 dark:text-slate-200 hover:bg-white/40 shadow-2xs' 
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base shrink-0">{item.emoji}</span>
                      <span className="text-[11px] sm:text-xs leading-tight font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon / Emoji Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Icon / Emoji
                </label>
                <span className="text-[10px] text-slate-400">Tap to pick</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
                {POPULAR_EMOJIS.map((itemIcon) => {
                  const isSelected = icon === itemIcon;
                  return (
                    <button
                      key={itemIcon}
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setIcon(itemIcon);
                      }}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center transition-all border cursor-pointer active:scale-90 ${
                        isSelected
                          ? isGlass 
                            ? 'bg-white/80 border-amber-400 scale-110 shadow-xs text-sky-600' 
                            : 'bg-amber-100 dark:bg-amber-950 border-amber-500 scale-110 shadow-xs ring-2 ring-amber-400/50 text-amber-600'
                          : isGlass 
                            ? 'bg-white/20 border-white/30 hover:bg-white/40 text-slate-700 dark:text-slate-300' 
                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <RewardIconRenderer icon={itemIcon} fallbackEmoji="🎁" className="w-5 h-5" size={20} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Group 2: Point Cost Stepper & Quick Chips */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
            isGlass ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Star Point Cost
              </h3>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                <span>{pointCost} points required</span>
              </span>
            </div>

            {/* Stepper with +/- buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustPoints(-25)}
                className={`px-3 py-2 rounded-xl text-xs font-black min-h-[44px] transition-all border cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
                  isGlass 
                    ? 'apple-glass-button' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                -25
              </button>
              <button
                type="button"
                onClick={() => handleAdjustPoints(-5)}
                className={`p-2.5 rounded-xl min-h-[44px] min-w-[44px] transition-all border cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
                  isGlass 
                    ? 'apple-glass-button' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="5"
                  max="10000"
                  step="5"
                  value={pointCost}
                  onChange={(e) => setPointCost(Number(e.target.value))}
                  className={`w-full text-center text-lg sm:text-xl font-black p-2.5 rounded-xl border min-h-[44px] text-amber-950 dark:text-amber-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 ${
                    isGlass 
                      ? 'apple-glass-input bg-white/40 border-white/50 shadow-inner' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleAdjustPoints(5)}
                className={`p-2.5 rounded-xl min-h-[44px] min-w-[44px] transition-all border cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
                  isGlass 
                    ? 'apple-glass-button' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustPoints(25)}
                className={`px-3 py-2 rounded-xl text-xs font-black min-h-[44px] transition-all border cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
                  isGlass 
                    ? 'apple-glass-button' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                +25
              </button>
            </div>

            {/* Quick point chips */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1">Quick Presets:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_POINTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setPointCost(preset);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border min-h-[32px] cursor-pointer active:scale-95 ${
                      pointCost === preset
                        ? isGlass 
                          ? 'bg-amber-400/40 border-amber-400/80 text-amber-950 shadow-xs font-black ring-1 ring-amber-400/50' 
                          : 'bg-amber-500 text-white border-amber-600 font-black shadow-2xs'
                        : isGlass 
                          ? 'bg-white/25 border-white/35 text-slate-800 dark:text-slate-200 hover:bg-white/40 shadow-2xs' 
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    ⭐ {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group 3: Progression & Gamification Unlock Tier */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
            isGlass ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Progression Tier & Requirements</span>
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isGlass 
                  ? 'bg-amber-400/25 border border-amber-400/40 text-amber-950 dark:text-amber-200 backdrop-blur-xs shadow-2xs' 
                  : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'
              }`}>
                Game Theory
              </span>
            </div>

            {/* Minimum Level Stepper */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Helper Level Required to Unlock
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setMinLevel(lvl);
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                      minLevel === lvl
                        ? 'bg-amber-500 text-white border-amber-400 shadow-md font-black ring-2 ring-amber-400/40'
                        : isGlass
                          ? 'bg-white/25 border-white/35 text-slate-800 dark:text-slate-200 hover:bg-white/40 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Lv.{lvl}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Higher level items stay locked until the child earns enough lifetime XP.
              </p>
            </div>

            {/* Rarity Tier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reward Rarity Tier
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'common', label: 'Common', glassUnselected: 'bg-white/25 text-slate-800 dark:text-slate-200 border-white/35 hover:bg-white/40', defaultColor: 'bg-slate-100 text-slate-700 border-slate-200' },
                  { id: 'rare', label: 'Rare', glassUnselected: 'bg-blue-500/15 text-blue-900 dark:text-blue-200 border-blue-400/30 hover:bg-blue-500/25', defaultColor: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { id: 'epic', label: 'Epic', glassUnselected: 'bg-purple-500/15 text-purple-900 dark:text-purple-200 border-purple-400/30 hover:bg-purple-500/25', defaultColor: 'bg-purple-100 text-purple-700 border-purple-200' },
                  { id: 'legendary', label: 'Legendary', glassUnselected: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-400/30 hover:bg-amber-500/25', defaultColor: 'bg-amber-100 text-amber-800 border-amber-200' },
                  { id: 'jackpot', label: 'Jackpot', glassUnselected: 'bg-rose-500/15 text-rose-900 dark:text-rose-200 border-rose-400/30 hover:bg-rose-500/25', defaultColor: 'bg-rose-100 text-rose-700 border-rose-200' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setRarity(r.id as any);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center active:scale-95 ${
                      rarity === r.id
                        ? isGlass
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md font-black border-transparent ring-2 ring-amber-400/50'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-black border-transparent'
                        : isGlass
                          ? `${r.glassUnselected} shadow-2xs`
                          : `${r.defaultColor} dark:border-slate-700`
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group 4: Description & Redemption Conditions */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2 ${
            isGlass ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
          }`}>
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Redemption Instructions (Optional)
            </h3>
            <textarea
              rows={2}
              placeholder="e.g. Must finish all homework first. Redeemed on Friday family movie night."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full text-xs sm:text-sm p-2.5 rounded-xl border font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 ${
                isGlass 
                  ? 'apple-glass-input text-slate-900 dark:text-white placeholder-slate-400' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400'
              }`}
            />
          </div>

          {/* Group 4: Eligibility / Helper Access */}
          {kidsAndTeens.length > 0 && (
            <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
              isGlass ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Who Can Redeem This?
                </h3>
                <span className="text-[10px] text-slate-400">Role visibility</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setAllowedRoles(['child', 'teen']);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border min-h-[38px] cursor-pointer active:scale-95 ${
                    allowedRoles.includes('child') && allowedRoles.includes('teen')
                      ? isGlass 
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-950 dark:text-emerald-100 font-black shadow-xs ring-1 ring-emerald-400/40' 
                        : 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                      : isGlass 
                        ? 'bg-white/25 border-white/35 text-slate-800 dark:text-slate-200 hover:bg-white/40 shadow-2xs' 
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>👨‍👩‍👧‍👦 All Kids & Teens</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setAllowedRoles(['teen']);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border min-h-[38px] cursor-pointer active:scale-95 ${
                    allowedRoles.length === 1 && allowedRoles.includes('teen')
                      ? isGlass 
                        ? 'bg-purple-500/30 border-purple-400 text-purple-950 dark:text-purple-100 font-black shadow-xs ring-1 ring-purple-400/40' 
                        : 'bg-purple-600 text-white border-purple-700 font-black shadow-xs'
                      : isGlass 
                        ? 'bg-white/25 border-white/35 text-slate-800 dark:text-slate-200 hover:bg-white/40 shadow-2xs' 
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🎒 Teens Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setAllowedRoles(['child']);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border min-h-[38px] cursor-pointer active:scale-95 ${
                    allowedRoles.length === 1 && allowedRoles.includes('child')
                      ? isGlass 
                        ? 'bg-indigo-500/30 border-indigo-400 text-indigo-950 dark:text-indigo-100 font-black shadow-xs ring-1 ring-indigo-400/40' 
                        : 'bg-indigo-600 text-white border-indigo-700 font-black shadow-xs'
                      : isGlass 
                        ? 'bg-white/25 border-white/35 text-slate-800 dark:text-slate-200 hover:bg-white/40 shadow-2xs' 
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🧸 Younger Kids Only</span>
                </button>
              </div>
            </div>
          )}

          {/* Delete Action Row (Apple HIG Destructive Pattern) */}
          {isEditing && onDeleteReward && (
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              showConfirmDelete 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' 
                : isGlass 
                  ? 'apple-glass-card border-white/30' 
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}>
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setShowConfirmDelete(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete This Reward</span>
                </button>
              ) : (
                <div className="space-y-2 text-center">
                  <p className="text-xs font-black text-rose-700 dark:text-rose-300">
                    Are you sure you want to remove "{rewardToEdit?.title}"?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kids will no longer see this in the rewards catalog.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 min-h-[38px] cursor-pointer"
                    >
                      Keep Reward
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs min-h-[38px] cursor-pointer"
                    >
                      Yes, Delete Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Buttons for Large Screens */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleDismiss}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                isGlass 
                  ? 'apple-glass-button' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black active:scale-95 shadow-md min-h-[44px] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isGlass 
                  ? 'apple-glass-button-primary' 
                  : `${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText}`
              }`}
            >
              {isEditing ? 'Save Changes' : 'Create Reward'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
