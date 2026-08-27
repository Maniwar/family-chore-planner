import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Star, 
  Clock, 
  AlertCircle, 
  CheckSquare, 
  MessageSquare, 
  Filter, 
  History,
  ThumbsUp
} from 'lucide-react';
import { Chore, ChoreAssignmentLog, HouseholdMember } from '../types';
import { formatDisplayDate, formatTimeDisplay } from '../utils/storage';

interface InspectionQueueViewProps {
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  members: HouseholdMember[];
  onOpenInspect: (chore: Chore, log: ChoreAssignmentLog) => void;
  onQuickApprove: (choreId: string, logId: string) => void;
  onBatchApproveAll: (items: { chore: Chore; log: ChoreAssignmentLog }[]) => void;
}

export const InspectionQueueView: React.FC<InspectionQueueViewProps> = ({
  chores,
  logs,
  members,
  onOpenInspect,
  onQuickApprove,
  onBatchApproveAll,
}) => {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Find all logs waiting for review
  const pendingReviewLogs = logs.filter(l => l.status === 'needs_review');

  const pendingItems = pendingReviewLogs.map(log => {
    const chore = chores.find(c => c.id === log.choreId);
    const member = members.find(m => m.id === log.memberId);
    return { log, chore, member };
  }).filter((item): item is { log: ChoreAssignmentLog; chore: Chore; member: HouseholdMember } => 
    !!item.chore && !!item.member
  );

  const filteredPending = selectedMemberFilter === 'all'
    ? pendingItems
    : pendingItems.filter(item => item.member.id === selectedMemberFilter);

  // Recent reviewed history logs
  const recentApprovedLogs = logs
    .filter(l => l.status === 'approved' && l.reviewedAt)
    .sort((a, b) => (b.reviewedAt || '').localeCompare(a.reviewedAt || ''))
    .slice(0, 10)
    .map(log => {
      const chore = chores.find(c => c.id === log.choreId);
      const member = members.find(m => m.id === log.memberId);
      return { log, chore, member };
    }).filter((item): item is { log: ChoreAssignmentLog; chore: Chore; member: HouseholdMember } => 
      !!item.chore && !!item.member
    );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl font-bold">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold leading-tight">
                  Mom's Quality Inspection Queue
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white text-rose-700">
                  {pendingItems.length} Waiting
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Inspect completed chores, verify cleanliness checklist, and award star bonuses
              </p>
            </div>
          </div>

          {pendingItems.length > 0 && (
            <button
              onClick={() => onBatchApproveAll(pendingItems.map(p => ({ chore: p.chore, log: p.log })))}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 shadow-sm transition-all"
            >
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <span>Approve All with 5 Stars ({pendingItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Tab Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Filter by child:</span>
          
          <button
            onClick={() => setSelectedMemberFilter('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              selectedMemberFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Kids ({pendingItems.length})
          </button>

          {members.filter(m => m.role !== 'parent').map((member) => {
            const count = pendingItems.filter(p => p.member.id === member.id).length;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberFilter(member.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                  selectedMemberFilter === member.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{member.avatarEmoji}</span>
                <span>{member.name}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedMemberFilter === member.id ? 'bg-rose-800 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            showHistory 
              ? 'bg-slate-100 text-slate-900 border-slate-300' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{showHistory ? 'Hide Recent History' : 'Show Recent History'}</span>
        </button>
      </div>

      {/* Main Inspection Feed */}
      {filteredPending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center text-3xl mb-3">
            ✨
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            All Caught Up, Mom!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no chores currently waiting for your inspection. Check back once family members mark their tasks as done.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPending.map(({ log, chore, member }) => {
            const checklistDone = Object.values(log.checklistStatus || {}).filter(Boolean).length;
            const checklistTotal = chore.qualityChecklist.length;

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-amber-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Member, Date, Points */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                        {member.avatarEmoji}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          {member.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDisplayDate(log.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        ⭐ {chore.defaultPoints} pts base
                      </span>
                    </div>
                  </div>

                  {/* Chore Title & Category */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 inline-block mb-1">
                      {chore.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {chore.title}
                    </h3>
                    {chore.description && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {chore.description}
                      </p>
                    )}
                  </div>

                  {/* Child Submission Note */}
                  {log.completedNote && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 mb-3 text-xs">
                      <span className="font-semibold text-amber-900">💬 Helper's Note:</span>
                      <p className="text-amber-800 italic mt-0.5">"{log.completedNote}"</p>
                    </div>
                  )}

                  {/* Quality Checklist verification summary */}
                  {checklistTotal > 0 && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
                      <div className="flex items-center justify-between text-slate-600 font-semibold mb-1.5">
                        <span>Quality Checklist Verification</span>
                        <span className="text-slate-900 font-bold">{checklistDone}/{checklistTotal} checked</span>
                      </div>
                      <div className="space-y-1">
                        {chore.qualityChecklist.map((item, idx) => {
                          const isDone = !!log.checklistStatus?.[idx];
                          return (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                              <span className={isDone ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                {isDone ? '✓' : '○'}
                              </span>
                              <span className={isDone ? 'text-slate-700' : 'text-slate-400 line-through'}>
                                {item}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inspection Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onOpenInspect(chore, log)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inspect & Grade (Stars + Bonus)</span>
                  </button>

                  <button
                    onClick={() => onQuickApprove(chore.id, log.id)}
                    className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors"
                    title="Quick Approve 5 Stars"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pass (5⭐)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Inspection History Section */}
      {showHistory && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Recent Quality Inspections & Grades</span>
            </h3>
            <span className="text-xs text-slate-400">Last 10 inspections</span>
          </div>

          {recentApprovedLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No previous inspection history yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApprovedLogs.map(({ log, chore, member }) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{member.avatarEmoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{chore.title}</span>
                        <span className="text-slate-400">({member.name})</span>
                      </div>
                      {log.feedbackNote && (
                        <p className="text-slate-500 italic mt-0.5">"{log.feedbackNote}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < (log.qualityScore || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +{ (log.pointsAwarded || chore.defaultPoints) + (log.bonusPoints || 0) } pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
