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

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: Chore | null;
  log: ChoreAssignmentLog | null;
  assignee: HouseholdMember | null;
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
  onSaveGrading,
}) => {
  if (!isOpen || !chore) return null;

  const [starRating, setStarRating] = useState<number>(log?.qualityScore || 5);
  const [bonusPoints, setBonusPoints] = useState<number>(log?.bonusPoints !== undefined ? log.bonusPoints : 5);
  const [feedbackNote, setFeedbackNote] = useState<string>(log?.feedbackNote || '');
  const [checklistStatus, setChecklistStatus] = useState<{ [key: number]: boolean }>(
    log?.checklistStatus || {}
  );
  const [hoverStar, setHoverStar] = useState<number | null>(null);

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
      case 5: return { label: '✨ Spotless Perfection (+5 Bonus Pts)', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 4: return { label: '👍 Great Job, Clean & Neat (+2 Bonus Pts)', tone: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 3: return { label: '👌 Good Effort, Acceptable Standard', tone: 'text-slate-700 bg-slate-100 border-slate-200' };
      case 2: return { label: '⚠️ Minor Missed Spots (Needs Reminder)', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 1: return { label: '❌ Incomplete / Redo Requested', tone: 'text-rose-700 bg-rose-50 border-rose-200' };
      default: return { label: 'Grade Quality', tone: 'text-slate-700 bg-slate-50 border-slate-200' };
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
    setChecklistStatus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const totalPoints = chore.defaultPoints + bonusPoints;
  const grade = getQualityGrade(starRating);
  const currentRatingDesc = getQualityDescription(hoverStar || starRating);

  const handleApprove = () => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="mom-inspection-modal"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl font-bold">
              🔍
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-100">
                Mom's Quality Inspection
              </span>
              <h2 className="text-lg font-bold leading-tight">
                {chore.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Member & Submission Info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <Avatar
                photoUrl={assignee?.avatarPhotoUrl}
                emoji={assignee?.avatarEmoji || '👤'}
                name={assignee?.name || 'Helper'}
                size="md"
              />
              <div>
                <p className="text-xs text-slate-500">Assigned Helper</p>
                <p className="text-sm font-bold text-slate-900">{assignee?.name || 'Family Member'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Base: {chore.defaultPoints} pts
              </span>
            </div>
          </div>

          {/* Child's note if provided */}
          {log?.completedNote && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                💬 {assignee?.name.split(' ')[0]}'s Submission Note:
              </p>
              <p className="text-xs text-amber-800 italic">
                "{log.completedNote}"
              </p>
            </div>
          )}

          {/* Quality Checklist Inspection */}
          {chore.qualityChecklist.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Verify Quality Criteria Checklist
              </label>
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {chore.qualityChecklist.map((item, idx) => {
                  const isChecked = !!checklistStatus[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleCheckItem(idx)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isChecked
                          ? 'bg-emerald-100/70 text-emerald-900 font-medium'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Star Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quality Grade & Star Rating
            </label>

            <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-xl border border-slate-200">
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
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                        isActive
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Rating Description Banner */}
            <div className={`mt-2 p-2.5 rounded-lg border text-center text-xs font-bold ${currentRatingDesc.tone}`}>
              {currentRatingDesc.label}
            </div>
          </div>

          {/* Points & Quality Bonus Adjustment */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Total Points to Award
                </span>
                <p className="text-xs text-amber-700">
                  Base ({chore.defaultPoints}) + Quality Bonus ({bonusPoints})
                </p>
              </div>

              <div className="text-2xl font-extrabold text-amber-900 bg-white px-4 py-1.5 rounded-xl border border-amber-300 shadow-xs">
                {totalPoints} pts
              </div>
            </div>

            {/* Bonus Points Stepper */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-200/70 text-xs">
              <span className="font-semibold text-slate-700">Bonus Points for Extra Effort:</span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBonusPoints(Math.max(-5, bonusPoints - 1))}
                  className="p-1 rounded-md bg-white text-slate-700 hover:bg-slate-100 border border-amber-200 shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-slate-900 w-8 text-center text-sm">
                  {bonusPoints > 0 ? `+${bonusPoints}` : bonusPoints}
                </span>
                <button
                  type="button"
                  onClick={() => setBonusPoints(bonusPoints + 1)}
                  className="p-1 rounded-md bg-white text-slate-700 hover:bg-slate-100 border border-amber-200 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mom's Feedback Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Mom's Feedback & Encouragement Note
            </label>
            <textarea
              id="inspection-feedback-input"
              rows={2}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Great job wiping the counters and loading the dishwasher!"
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
            />

            {/* Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {feedbackPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFeedbackNote(preset)}
                  className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
            <button
              id="btn-confirm-approve"
              type="button"
              onClick={handleApprove}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Award {totalPoints} Points</span>
            </button>

            <button
              id="btn-confirm-redo"
              type="button"
              onClick={handleRequestRedo}
              className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Request Touch-up (Redo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
