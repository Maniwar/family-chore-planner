import React, { useState } from 'react';
import { 
  Sparkles, 
  Trophy, 
  Check, 
  X, 
  Crown, 
  Zap, 
  Shield, 
  Gift, 
  Lock, 
  RefreshCw, 
  Palette, 
  User, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { HouseholdMember } from '../types';
import { COSMETIC_ITEMS, getMemberProgression, CosmeticAvatarItem } from '../utils/progression';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface CosmeticsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  selectedMemberId?: string;
  onEquipCosmetic: (memberId: string, cosmeticId: string) => void;
  currentTheme?: ThemePreset;
  isMomMode?: boolean;
}

export const CosmeticsManagerModal: React.FC<CosmeticsManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  selectedMemberId,
  onEquipCosmetic,
  currentTheme = 'rose',
  isMomMode = true,
}) => {
  if (!isOpen) return null;

  const isGlass = isGlassTheme(currentTheme);

  // Active account selection
  const [activeMemberId, setActiveMemberId] = useState<string>(
    selectedMemberId || members[0]?.id || ''
  );

  const activeMember = members.find(m => m.id === activeMemberId) || members[0];
  const progression = activeMember ? getMemberProgression(activeMember) : null;
  const currentEquippedId = activeMember?.equippedCosmeticId || '';
  const equippedItem = COSMETIC_ITEMS.find(c => c.id === currentEquippedId);

  // Temporary preview selection
  const [previewCosmeticId, setPreviewCosmeticId] = useState<string | null>(null);
  const activePreviewId = previewCosmeticId !== null ? previewCosmeticId : currentEquippedId;
  const previewItem = COSMETIC_ITEMS.find(c => c.id === activePreviewId);

  const handleSelectMember = (id: string) => {
    soundFX.playPop();
    setActiveMemberId(id);
    setPreviewCosmeticId(null);
  };

  const handleEquip = (cosmeticId: string) => {
    if (!activeMember) return;
    soundFX.playFanfare();
    onEquipCosmetic(activeMember.id, cosmeticId);
    setPreviewCosmeticId(cosmeticId);
  };

  const handleUnequip = () => {
    if (!activeMember) return;
    soundFX.playPop();
    onEquipCosmetic(activeMember.id, '');
    setPreviewCosmeticId('');
  };

  return (
    <div 
      className={`fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 ${
        isGlass ? 'backdrop-blur-md bg-slate-900/40' : 'bg-slate-900/60'
      }`}
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div 
        className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isGlass 
            ? 'apple-glass-panel border-white/40 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-2xl' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-500/20">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  In-Game Avatar Cosmetics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700">
                  Per-Account
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize profile aura rings, celestial laser borders, and achievement crowns.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Account Switcher */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select Family Account to Customize</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {members.length} Accounts
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
            {members.map(member => {
              const isSelected = member.id === activeMemberId;
              const prog = getMemberProgression(member);
              const cosmetic = COSMETIC_ITEMS.find(c => c.id === member.equippedCosmeticId);

              return (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member.id)}
                  className={`px-3 py-2 rounded-2xl border transition-all flex items-center gap-2.5 shrink-0 cursor-pointer min-h-[44px] active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md font-black ring-2 ring-indigo-500/20'
                      : isGlass
                      ? 'apple-glass-card hover:bg-white/60 text-slate-800 border-white/40'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Avatar
                    photoUrl={member.avatarPhotoUrl}
                    emoji={member.avatarEmoji}
                    name={member.name}
                    size="sm"
                    cosmeticClass={cosmetic?.cssClass}
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>{member.name.split(' ')[0]}</span>
                      {cosmetic && <span className="text-[10px]">✨</span>}
                    </div>
                    <div className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>
                      Lv.{prog.currentLevel.level} • {member.role === 'parent' ? 'Admin' : `${member.currentPoints} pts`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Live Profile Avatar Showcase */}
          {activeMember && (
            <div className={`p-5 sm:p-6 rounded-3xl border ${
              isGlass 
                ? 'apple-glass-card border-white/40 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-cyan-500/15' 
                : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800'
            } flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden`}>
              {/* Background ambient radial glow */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 z-10 w-full sm:w-auto text-center sm:text-left">
                {/* Stage for Avatar with generous space for wings & crowns */}
                <div className="relative py-4 px-7 flex items-center justify-center shrink-0">
                  <Avatar
                    photoUrl={activeMember.avatarPhotoUrl}
                    emoji={activeMember.avatarEmoji}
                    name={activeMember.name}
                    size="2xl"
                    cosmeticId={activePreviewId || undefined}
                    className="transition-all duration-300"
                  />
                  {progression && (
                    <span className="absolute bottom-2 right-4 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900 z-20">
                      Lv.{progression.currentLevel.level}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white sm:text-white">
                      {activeMember.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                      {progression?.currentLevel.title || 'Chore Hero'}
                    </span>
                    {previewItem && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${previewItem.badgeColor}`}>
                        {previewItem.rarityBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-cyan-300 dark:text-cyan-300 flex items-center justify-center sm:justify-start gap-1.5">
                    {previewItem ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>{previewItem.name} — {previewItem.tagline}</span>
                      </>
                    ) : (
                      <span className="text-slate-300">Default Clean Frame (No Glow)</span>
                    )}
                  </p>

                  {/* Feature Bullets for Previewed Cosmetic */}
                  {previewItem && previewItem.features && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-1">
                      {previewItem.features.map((feat, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/15 backdrop-blur-xs flex items-center gap-1"
                        >
                          <span className="text-amber-400">⚡</span>
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 pt-0.5">
                    Lifetime Score: {activeMember.lifetimePoints || activeMember.currentPoints || 0} XP • Balance: ⭐ {activeMember.currentPoints || 0} pts
                  </p>
                </div>
              </div>

              {/* Status & Quick Action on Selected Member */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 z-10 w-full sm:w-auto justify-center sm:justify-end">
                {currentEquippedId && (
                  <button
                    type="button"
                    onClick={handleUnequip}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-950/60 border border-rose-500/40 transition-colors cursor-pointer"
                  >
                    Remove Frame
                  </button>
                )}
                {previewCosmeticId !== null && previewCosmeticId !== currentEquippedId && (
                  <button
                    type="button"
                    onClick={() => handleEquip(previewCosmeticId)}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply to {activeMember.name.split(' ')[0]}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cosmetic Frames Catalog Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>Available Avatar Cosmetics ({COSMETIC_ITEMS.length + 1})</span>
              </span>
              <span className="text-xs text-slate-400">
                Tap card to preview or equip
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 0: None / Default Clean */}
              <div
                onClick={() => setPreviewCosmeticId('')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activePreviewId === ''
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/40'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 text-sm font-black shrink-0">
                    ⚪
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Default Clean Border
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      Standard profile avatar with no custom aura glow or frame effects.
                    </p>
                    <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md mt-1">
                      Free • Standard
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  {currentEquippedId === '' ? (
                    <div className="w-full py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Currently Active</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnequip();
                      }}
                      className="w-full py-1.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Equip Default</span>
                    </button>
                  )}
                </div>
              </div>

              {/* All Cosmetic Frames */}
              {COSMETIC_ITEMS.map(item => {
                const isEquipped = currentEquippedId === item.id;
                const isPreviewing = activePreviewId === item.id;
                const isUnlocked = activeMember?.unlockedCosmeticIds?.includes(item.id);
                const isLevelEligible = progression ? progression.currentLevel.level >= item.minLevel : true;

                return (
                  <div
                    key={item.id}
                    onClick={() => setPreviewCosmeticId(item.id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isPreviewing
                        ? 'bg-cyan-50/80 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-400/50 shadow-md'
                        : isEquipped
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-3">
                        {/* Avatar preview with enough padding for wings and crowns */}
                        <div className="py-2 px-3 shrink-0 flex items-center justify-center">
                          <Avatar
                            photoUrl={activeMember?.avatarPhotoUrl}
                            emoji={activeMember?.avatarEmoji}
                            name={activeMember?.name || 'Helper'}
                            size="lg"
                            cosmeticId={item.id}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                              {item.rarityBadge}
                            </span>
                            {isEquipped && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                Equipped
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                              Requires Lv.{item.minLevel} • {item.pointCost} pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Feature Tags */}
                      {item.features && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-3 px-1">
                          {item.features.map((feat, fIdx) => (
                            <span 
                              key={fIdx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                            >
                              <span className="text-amber-500">✨</span>
                              <span>{feat}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      {isEquipped ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnequip();
                          }}
                          className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 hover:bg-rose-100 hover:text-rose-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Equipped (Tap to Remove)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquip(item.id);
                          }}
                          className="w-full py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-cyan-700 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-cyan-100 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-600" />
                          <span>Equip {item.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-850/80 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>✨ Cosmetics show on chore checklists, inspection badges & family cards.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
