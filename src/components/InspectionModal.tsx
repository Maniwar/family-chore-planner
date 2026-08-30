import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Award, 
  MessageSquare,
  CheckSquare,
  Square,
  Plus,
  Minus
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: Chore | null;
  log: ChoreAssignmentLog | null;
  assignee: HouseholdMember | null;
  currentTheme?: ThemePreset;
  onSaveGrading: (
    logId: string,
    score: number,
    grade: 'A+' | 'A' | 'B' | 'C' | 'Redo',
    bonusPoints: number,
    feedbackNote: string,
    checklistStatus: { [key: number]: boolean },
    isRedo: boolean
  ) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  chore,
  log,
  assignee,
  currentTheme = 'rose',
  onSaveGrading,
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 45,
  });

  if (!isOpen || !chore) return null;
  const theme = THEMES[currentTheme] || THEMES.rose;

  const [starRating, setStarRating] = useState<number>(log?.qualityScore || 5);
  const [bonusPoints, setBonusPoints] = useState<number>(log?.bonusPoints !== undefined ? log.bonusPoints : 5);
  const [feedbackNote, setFeedbackNote] = useState<string>(log?.feedbackNote || '');
  const [checklistStatus, setChecklistStatus] = useState<{ [key: number]: boolean }>(
    log?.checklistStatus || {}
  );
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  // Trigger haptic vibration helper
  const triggerHaptic = (duration: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  };

  // Sync state on open
  useEffect(() => {
    if (log) {
      setStarRating(log.qualityScore || 5);
      setBonusPoints(log.bonusPoints !== undefined ? log.bonusPoints : 5);
      setFeedbackNote(log.feedbackNote || '');
      setChecklistStatus(log.checklistStatus || {});
    } else {
      setStarRating(5);
      setBonusPoints(5);
      setFeedbackNote('');
      setChecklistStatus({});
    }
  }, [log, chore]);

  // Adjust bonus points automatically based on star rating if user hasn't heavily customized
  const handleSelectStars = (stars: number) => {
    triggerHaptic(20);
    soundFX.playStarChime(stars);
    setStarRating(stars);
    if (stars === 5) {
      setBonusPoints(5);
    } else if (stars === 4) {
      setBonusPoints(2);
    } else if (stars === 3) {
      setBonusPoints(0);
    } else if (stars === 2) {
      setBonusPoints(0);
    } else {
      setBonusPoints(0);
    }
  };

  const getQualityGrade = (stars: number): 'A+' | 'A' | 'B' | 'C' | 'Redo' => {
    if (stars === 5) return 'A+';
    if (stars === 4) return 'A';
    if (stars === 3) return 'B';
    if (stars === 2) return 'C';
    return 'Redo';
  };

  const getQualityDescription = (stars: number): { label: string; tone: string } => {
    switch (stars) {
      case 5: return { label: '✨ Spotless Perfection (+5 Bonus Pts)', tone: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' };
      case 4: return { label: '👍 Great Job, Clean & Neat (+2 Bonus Pts)', tone: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' };
      case 3: return { label: '👌 Good Effort, Acceptable Standard', tone: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
      case 2: return { label: '⚠️ Minor Missed Spots (Needs Reminder)', tone: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' };
      case 1: return { label: '❌ Incomplete / Redo Requested', tone: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' };
      default: return { label: 'Grade Quality', tone: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    }
  };

  const feedbackPresets = [
    '✨ Spotless job! Loved the attention to detail.',
    '🌟 High five! Done quickly and thoroughly.',
    '👍 Good work, thank you for helping the house!',
    '🧹 Looks nice! Next time remember under the edges too.',
    '🧼 Almost there, just wipe off the counter crumbs.',
  ];

  const handleToggleCheckItem = (index: number) => {
    triggerHaptic(12);
    soundFX.playPop();
    setChecklistStatus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const totalPoints = chore.defaultPoints + bonusPoints;
  const grade = getQualityGrade(starRating);
  const currentRatingDesc = getQualityDescription(hoverStar || starRating);

  const handleApprove = () => {
    triggerHaptic(40);
    soundFX.playFanfare();
    const logId = log?.id || `log_${chore.id}_${Date.now()}`;
    onSaveGrading(
      logId,
      starRating,
      grade,
      bonusPoints,
      feedbackNote,
      checklistStatus,
      false
    );
    onClose();
  };

  const handleRequestRedo = () => {
    triggerHaptic([30, 50, 30]);
    soundFX.playPop();
    const logId = log?.id || `log_${chore.id}_${Date.now()}`;
    onSaveGrading(
      logId,
      1,
      'Redo',
      0,
      feedbackNote || 'Please redo this chore according to the checklist steps.',
      checklistStatus,
      true
    );
    onClose();
  };

  const isGlass = isGlassTheme(currentTheme);
  const isIce = currentTheme === 'crystal_ice';

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto ${
        isGlass ? 'bg-slate-900/20 backdrop-blur-sm' : 'bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm'
      } flex items-end sm:items-center justify-center p-0 sm:p-4`}
      onClick={handleDismiss}
    >
      <div 
        id="mom-inspection-modal"
        style={sheetStyle}
        className={`${
          isGlass 
            ? 'apple-glass-panel border-white/20' 
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl'
        } rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[94vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch-Bar (Tap to dismiss or drag down) */}
        <div className={`${
          isGlass
            ? isIce
              ? 'bg-transparent border-white/20 text-slate-900'
              : 'bg-transparent border-white/20 text-slate-900'
            : theme.primaryBg
        } shrink-0`}>
          <BottomSheetGrabber 
            dragHandleProps={dragHandleProps} 
            onClose={handleDismiss} 
            variant="white"
          />
        </div>

        {/* Header */}
        <div 
          className={`${
            isGlass
              ? isIce
                ? 'apple-glass-panel border-white/30 text-slate-900'
                : 'apple-glass-panel border-white/30 text-slate-900'
              : theme.primaryBg
          } px-4 py-3 sm:px-5 sm:py-3.5 ${isGlass ? '' : theme.primaryText} flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing select-none`}
          onTouchStart={dragHandleProps.onTouchStart}
          onPointerDown={dragHandleProps.onPointerDown}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8)] border border-white/40">
              🔍
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90 block truncate drop-shadow-xs">
                Quality Inspection & Grading
              </span>
              <h2 className="text-base sm:text-lg font-black leading-tight truncate drop-shadow-xs">
                {chore.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(10);
              handleDismiss();
            }}
            aria-label="Close modal"
            className="p-2 rounded-2xl text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Member & Submission Info */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
            isGlass 
              ? 'bg-white/20 backdrop-blur-xl border-white/20 shadow-[inset_1px_1.5px_0_rgba(255,255,255,1),0_4px_16px_rgba(31,38,135,0.06)]' 
              : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80'
          }`}>
            <div className="flex items-center space-x-3">
              <Avatar
                photoUrl={assignee?.avatarPhotoUrl}
                emoji={assignee?.avatarEmoji || '👤'}
                name={assignee?.name || 'Helper'}
                size="md"
              />
              <div>
                <p className={`text-[10px] ${isGlass ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'} uppercase font-bold`}>Assigned Helper</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{assignee?.name || 'Family Member'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                isGlass 
                  ? 'bg-amber-100/90 text-amber-950 border border-amber-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md'
                  : 'bg-amber-100/80 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800 backdrop-blur-xs'
              }`}>
                Base: {chore.defaultPoints} pts
              </span>
            </div>
          </div>

          {/* Child's note if provided */}
          {log?.completedNote && (
            <div className={`p-3.5 rounded-2xl border ${
              isGlass 
                ? 'bg-amber-50/60 backdrop-blur-xl border-amber-200/90 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8)]' 
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
            }`}>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>{assignee?.name.split(' ')[0]}'s Submission Note:</span>
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 italic leading-relaxed">
                "{log.completedNote}"
              </p>
            </div>
          )}

          {/* Quality Checklist Inspection */}
          {chore.qualityChecklist.length > 0 && (
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isGlass ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'} mb-2`}>
                Verify Quality Criteria Checklist
              </label>
              <div className={`space-y-2.5 p-2.5 sm:p-3 rounded-2xl border ${
                isGlass 
                  ? 'apple-glass-card border-white/30' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
              }`}>
                {chore.qualityChecklist.map((item, idx) => {
                  const isChecked = !!checklistStatus[idx];
                  return (
                    <div
                      key={idx}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onClick={() => handleToggleCheckItem(idx)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleCheckItem(idx);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-xs sm:text-sm min-h-[44px] touch-target select-none active:scale-[0.98] ${
                        isChecked
                          ? isGlass
                            ? 'bg-emerald-500/20 text-emerald-950 font-bold border border-emerald-400/90 backdrop-blur-xl shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8),0_4px_12px_rgba(16,185,129,0.15)]'
                            : 'bg-emerald-100/80 text-emerald-950 font-semibold border border-emerald-300 backdrop-blur-md shadow-xs'
                          : isGlass
                          ? 'bg-white/10 text-slate-900 hover:bg-white/20 border border-white/30 backdrop-blur-md shadow-[inset_1px_1.5px_0_rgba(255,255,255,0.4)]'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="shrink-0 flex items-center justify-center">
                        {isChecked ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-emerald-300">
                            <CheckSquare className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-lg ${
                            isGlass
                              ? 'border-1.5 border-white/20 bg-white/60 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95)]'
                              : 'border-2 border-slate-400 dark:border-slate-500 bg-white/80 dark:bg-slate-900'
                          } flex items-center justify-center`} />
                        )}
                      </div>
                      <span className="leading-snug break-words flex-1 font-semibold">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Star Rating */}
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${isGlass ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'} mb-2`}>
              Quality Grade & Star Rating
            </label>

            <div className={`flex items-center justify-center gap-2 sm:gap-3 py-3.5 rounded-2xl border ${
              isGlass 
                ? 'apple-glass-card border-white/30' 
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
            }`}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverStar || starRating) >= star;
                return (
                  <button
                    key={star}
                    id={`star-btn-${star}`}
                    type="button"
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(null)}
                    onClick={() => handleSelectStars(star)}
                    className="p-2 transition-transform hover:scale-110 active:scale-90 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                        isActive
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Rating Description Banner */}
            <div className={`mt-2 p-2.5 rounded-2xl border text-center text-xs font-bold ${currentRatingDesc.tone} ${isGlass ? 'backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7)]' : ''}`}>
              {currentRatingDesc.label}
            </div>
          </div>

          {/* Points & Quality Bonus Adjustment */}
          <div className={`p-3.5 rounded-2xl border ${
            isGlass 
              ? 'bg-gradient-to-br from-amber-50/60 to-orange-50/60 backdrop-blur-xl border-amber-200/90 shadow-[inset_1px_1.5px_0_rgba(255,255,255,0.95),0_4px_16px_rgba(245,158,11,0.1)]' 
              : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Total Points to Award
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Base ({chore.defaultPoints}) + Quality Bonus ({bonusPoints})
                </p>
              </div>

              <div className={`text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 px-3.5 py-1 rounded-2xl border border-amber-300 dark:border-amber-700 shadow-xs ${
                isGlass ? 'bg-white/85 backdrop-blur-md shadow-[inset_0_1px_1.5px_rgba(255,255,255,1)]' : 'bg-white dark:bg-slate-900'
              }`}>
                {totalPoints} pts
              </div>
            </div>

            {/* Bonus Points Stepper */}
            <div className="flex items-center justify-between pt-2.5 border-t border-amber-200/70 dark:border-amber-800/60 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Bonus for Extra Effort:</span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    soundFX.playPop();
                    setBonusPoints(Math.max(-5, bonusPoints - 1));
                  }}
                  className={`w-9 h-9 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-amber-200 dark:border-amber-700 shadow-xs flex items-center justify-center font-bold active:scale-95 cursor-pointer ${
                    isGlass ? 'bg-white/85 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-slate-900 dark:text-white w-8 text-center text-sm">
                  {bonusPoints > 0 ? `+${bonusPoints}` : bonusPoints}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    soundFX.playPop();
                    setBonusPoints(bonusPoints + 1);
                  }}
                  className={`w-9 h-9 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-amber-200 dark:border-amber-700 shadow-xs flex items-center justify-center font-bold active:scale-95 cursor-pointer ${
                    isGlass ? 'bg-white/85 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Note */}
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${isGlass ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'} mb-1.5`}>
              Feedback & Encouragement Note
            </label>
            <textarea
              id="inspection-feedback-input"
              rows={2}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Great job wiping the counters and loading the dishwasher!"
              className={`w-full text-xs p-3 rounded-2xl border ${
                isGlass 
                  ? 'bg-white/20 backdrop-blur-md border-white/30 text-slate-900 placeholder:text-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]' 
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
              } focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors font-medium`}
            />

            {/* Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {feedbackPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    soundFX.playPop();
                    setFeedbackNote(preset);
                  }}
                  className={`text-[11px] px-2.5 py-1.5 rounded-xl transition-colors text-left font-semibold cursor-pointer ${
                    isGlass 
                      ? 'bg-white/55 hover:bg-white/80 text-slate-800 border border-white/20 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]' 
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons (Sticky at bottom) */}
        <div className={`p-3 sm:p-4 border-t ${
          isGlass 
            ? 'border-white/30 bg-white/10 backdrop-blur-3xl shadow-[0_-4px_16px_rgba(0,0,0,0.05)]' 
            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
        } shrink-0 flex flex-col sm:flex-row gap-2`}>
          <button
            id="btn-confirm-approve"
            type="button"
            onClick={handleApprove}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all active:scale-[0.98] cursor-pointer min-h-[46px] ${isGlass ? 'apple-glass-button-primary' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Award {totalPoints} Points</span>
          </button>

          <button
            id="btn-confirm-redo"
            type="button"
            onClick={handleRequestRedo}
            className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
              isGlass
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-950 border border-rose-400/50 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.6)] backdrop-blur-xl'
                : 'bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Request Touch-up (Redo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

