import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  MessageSquareQuote,
  CheckSquare,
  Square,
  Edit2
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { formatTimeDisplay } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getTranslation, getCategoryTranslation } from '../utils/i18n';
import { Avatar } from './Avatar';

interface ChoreCardProps {
  chore: Chore;
  log?: ChoreAssignmentLog;
  assignee?: HouseholdMember;
  isMomMode: boolean;
  language?: SupportedLanguage;
  onMarkComplete: (choreId: string, note?: string, checklist?: { [key: number]: boolean }) => void;
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onQuickApprove: (choreId: string, logId: string) => void;
  onEditChore?: (chore: Chore) => void;
  onDeleteChore?: (choreId: string) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  log,
  assignee,
  isMomMode,
  language = 'en',
  onMarkComplete,
  onOpenInspect,
  onQuickApprove,
  onEditChore,
}) => {
  const t = getTranslation(language);
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>(
    log?.checklistStatus || {}
  );
  const [kidNote, setKidNote] = useState(log?.completedNote || '');

  const status = log?.status || 'pending';

  const handleToggleChecklistItem = (index: number) => {
    if (status === 'approved') return;
    soundFX.playPop();
    const updated = { ...checkedItems, [index]: !checkedItems[index] };
    setCheckedItems(updated);
  };

  const handleChildSubmit = () => {
    soundFX.playComplete();
    onMarkComplete(chore.id, kidNote, checkedItems);
  };

  // Category badge colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Kitchen': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Living Room': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Bedrooms': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Bathrooms': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Pets': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Laundry': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Yard & Outdoor': return 'bg-lime-50 text-lime-800 border-lime-200';
      case 'Daily Routine': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const completedChecklistCount = Object.values(checkedItems).filter(Boolean).length;
  const totalChecklistCount = chore.qualityChecklist.length;

  return (
    <div 
      id={`chore-card-${chore.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        status === 'needs_review'
          ? 'border-amber-300 shadow-sm bg-gradient-to-br from-white to-amber-50/40 ring-1 ring-amber-300'
          : status === 'approved'
          ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs'
          : status === 'needs_redo'
          ? 'border-rose-300 bg-gradient-to-br from-white to-rose-50/30 ring-1 ring-rose-200'
          : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Meta Line: Time, Category, Points */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${getCategoryColor(chore.category)}`}>
                {getCategoryTranslation(chore.category, language)}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}
              </span>

              {chore.estimatedMinutes && (
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  ~{chore.estimatedMinutes}m
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap">
                ⭐ {chore.defaultPoints} {t.pts}
              </span>

              {isMomMode && onEditChore && (
                <button
                  onClick={() => onEditChore(chore)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                  title="Edit Chore"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Title & Assignee Line */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug break-words">
                {chore.title}
              </h3>
              {chore.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {chore.description}
                </p>
              )}
            </div>

            {/* Assignee Avatar */}
            {assignee && (
              <div 
                className="flex items-center gap-1.5 shrink-0 bg-slate-50 hover:bg-slate-100 pl-1 pr-2 py-0.5 rounded-full border border-slate-200 shadow-2xs transition-colors"
                title={`${t.cardAssignedTo} ${assignee.name}`}
              >
                <Avatar
                  photoUrl={assignee.avatarPhotoUrl}
                  emoji={assignee.avatarEmoji}
                  name={assignee.name}
                  size="xs"
                  showBorder={false}
                />
                <span className="text-xs font-semibold text-slate-700 max-w-[70px] truncate">
                  {assignee.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Quality Checklist Summary & Toggle */}
          {totalChecklistCount > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <button
                onClick={() => {
                  soundFX.playPop();
                  setIsExpanded(!isExpanded);
                }}
                className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 py-1 font-medium group"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                  <span>{t.qualityChecklist} ({completedChecklistCount}/{totalChecklistCount})</span>
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Expanded Checklist Items */}
              {isExpanded && (
                <div className="mt-2 space-y-1.5 pl-1 pr-1 pb-1">
                  {chore.qualityChecklist.map((item, idx) => {
                    const isChecked = !!checkedItems[idx];
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleToggleChecklistItem(idx)}
                        className={`flex items-start gap-2 text-xs p-1.5 rounded-lg cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-emerald-50 text-emerald-800 line-through text-opacity-80' 
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-tight break-words">{item}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Status Feedback Block (Approved or Needs Redo) */}
          {status === 'approved' && log && (
            <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < (log.qualityScore || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800">
                    {log.qualityGrade || 'A+'} Grade
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                  +{ (log.pointsAwarded || chore.defaultPoints) + (log.bonusPoints || 0) } {t.pts}
                </span>
              </div>

              {log.feedbackNote && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-emerald-900 bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="italic break-words">{log.feedbackNote}</p>
                </div>
              )}
            </div>
          )}

          {status === 'needs_redo' && log && (
            <div className="mt-3 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{t.momRequestedRedo}</span>
              </div>
              {log.feedbackNote && (
                <p className="mt-1 text-xs text-rose-700 bg-white/80 p-1.5 rounded-lg border border-rose-100 italic break-words">
                  "{log.feedbackNote}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Bar with Responsive Width and Zero Overflow */}
        <div className="mt-4 pt-3 border-t border-slate-100 w-full">
          
          {/* Status: PENDING or NEEDS REDO */}
          {(status === 'pending' || status === 'needs_redo') && (
            <div className="w-full flex items-center gap-2">
              <button
                id={`btn-complete-chore-${chore.id}`}
                onClick={handleChildSubmit}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all active:scale-[0.98] min-w-0"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{status === 'needs_redo' ? t.fixedSubmit : t.markDone}</span>
              </button>

              {isMomMode && (
                <button
                  id={`btn-instant-approve-${chore.id}`}
                  onClick={() => {
                    soundFX.playPop();
                    const tempLog = log || {
                      id: `quick_log_${chore.id}`,
                      choreId: chore.id,
                      memberId: chore.assignedMemberId,
                      date: new Date().toISOString().split('T')[0],
                      status: 'pending'
                    };
                    onOpenInspect(chore, tempLog);
                  }}
                  className="px-2.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
                  title={t.inspectAndGrade}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </button>
              )}
            </div>
          )}

          {/* Status: NEEDS REVIEW (Child submitted, waiting for Mom) */}
          {status === 'needs_review' && log && (
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="truncate">{t.awaitingMom}</span>
                </div>
                {!isMomMode && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Submitted ✨
                  </span>
                )}
              </div>

              {isMomMode ? (
                /* Mom / Admin Mode: Inspect & Quick Approve buttons */
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <button
                    id={`btn-inspect-grade-${chore.id}`}
                    onClick={() => {
                      soundFX.playPop();
                      onOpenInspect(chore, log);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-xs transition-transform active:scale-[0.98] min-w-0 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.inspectAndGrade}</span>
                  </button>

                  <button
                    id={`btn-quick-approve-${chore.id}`}
                    onClick={() => {
                      soundFX.playStarChime(5);
                      onQuickApprove(chore.id, log.id);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-transform active:scale-[0.98] min-w-0 cursor-pointer"
                    title={t.quickApproveTitle}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{t.pass5Star}</span>
                  </button>
                </div>
              ) : (
                /* Kid Mode: Friendly confirmation message without admin approval triggers */
                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-center">
                  <p className="text-xs font-semibold text-amber-900 leading-snug">
                    🎉 Great job! Mom will review your work and award your stars soon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status: APPROVED */}
          {status === 'approved' && (
            <div className="w-full flex items-center justify-between text-xs text-emerald-700 font-bold gap-2">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{t.inspectedApproved}</span>
              </span>

              {isMomMode && log && (
                <button
                  onClick={() => {
                    soundFX.playPop();
                    onOpenInspect(chore, log);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium whitespace-nowrap shrink-0"
                >
                  {t.editGradePoints}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
