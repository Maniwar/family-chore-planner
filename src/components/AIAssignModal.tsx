import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  TrendingUp, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Sliders, 
  RefreshCw,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';
import { HouseholdMember, Chore, AIAssignmentResult, AIAssignmentSuggestion } from '../types';
import { getMemberEffectiveAge } from '../utils/age';
import { ThemePreset, THEMES } from '../utils/theme';

interface AIAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  chores: Chore[];
  currentTheme?: ThemePreset;
  onApplyAssignments: (assignments: { choreId: string; assignedMemberId: string }[]) => void;
}

export const AIAssignModal: React.FC<AIAssignModalProps> = ({
  isOpen,
  onClose,
  members,
  chores,
  currentTheme = 'rose',
  onApplyAssignments,
}) => {
  if (!isOpen) return null;
  const theme = THEMES[currentTheme] || THEMES.rose;

  const [activeTab, setActiveTab] = useState<'assigner' | 'coach'>('assigner');
  const [focusGoal, setFocusGoal] = useState<'balanced_developmental' | 'skill_building' | 'rotation'>('balanced_developmental');
  const [includeParents, setIncludeParents] = useState<boolean>(false);
  const [targetScope, setTargetScope] = useState<'all' | 'unassigned_only'>('all');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAssignmentResult | null>(null);
  const [selectedChoreIds, setSelectedChoreIds] = useState<{ [choreId: string]: boolean }>({});

  // AI Coach state
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const handleGenerateAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filteredChores = targetScope === 'unassigned_only' 
        ? chores.filter(c => c.assignedMemberId === 'unassigned' || !c.assignedMemberId)
        : chores;

      if (filteredChores.length === 0) {
        setError('No eligible chores found for the selected scope.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/ai/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: members.map(m => ({
            id: m.id,
            name: m.name,
            role: m.role,
            age: getMemberEffectiveAge(m),
            birthDate: m.birthDate,
            currentPoints: m.currentPoints,
            targetWeeklyPoints: m.targetWeeklyPoints,
          })),
          chores: filteredChores.map(c => ({
            id: c.id,
            title: c.title,
            category: c.category,
            estimatedMinutes: c.estimatedMinutes,
            difficulty: c.difficulty,
            defaultPoints: c.defaultPoints,
            currentAssignedMemberId: c.assignedMemberId,
          })),
          focusGoal,
          includeParents,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `AI assignment request failed with status ${response.status}`);
      }

      const data: AIAssignmentResult = await response.json();
      setAiResult(data);

      // Default select all suggestions
      const initialSelected: { [id: string]: boolean } = {};
      data.suggestions.forEach(s => {
        initialSelected[s.choreId] = true;
      });
      setSelectedChoreIds(initialSelected);
    } catch (err: any) {
      console.error('Error generating AI assignments:', err);
      setError(err.message || 'Failed to generate assignments. Please ensure the Gemini API key is configured.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!aiResult) return;

    const toApply = aiResult.suggestions
      .filter(s => selectedChoreIds[s.choreId] !== false)
      .map(s => ({
        choreId: s.choreId,
        assignedMemberId: s.assignedMemberId,
      }));

    if (toApply.length === 0) {
      alert('Please select at least one chore assignment to apply.');
      return;
    }

    onApplyAssignments(toApply);
    onClose();
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!aiResult) return;
    const updated: { [id: string]: boolean } = {};
    aiResult.suggestions.forEach(s => {
      updated[s.choreId] = checked;
    });
    setSelectedChoreIds(updated);
  };

  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuestion.trim()) return;

    setIsCoachLoading(true);
    try {
      const response = await fetch('/api/ai/chore-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: coachQuestion.trim(),
          members: members.map(m => ({ 
            name: m.name, 
            role: m.role, 
            age: getMemberEffectiveAge(m),
            birthDate: m.birthDate 
          })),
          chores: chores.map(c => ({ title: c.title, category: c.category })),
        }),
      });

      if (!response.ok) throw new Error('Could not get response from AI coach.');
      const data = await response.json();
      setCoachAnswer(data.advice);
    } catch (err: any) {
      setCoachAnswer(`Error: ${err.message || 'Could not load advice.'}`);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const quickQuestions = [
    'What chores are best for a 6-8 year old child?',
    'How do I motivate kids without having to nag?',
    'How should we tie chore points to weekly allowance?',
    'What is a fair inspection checklist for bedroom cleaning?',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="ai-auto-assign-modal"
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-xl shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">AI Smart Chore Assigner & Coach</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Gemini 3.7
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Optimizes household task distribution based on child age, developmental milestones, and fair workload
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 px-5 pt-2 border-b border-slate-200 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('assigner')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'assigner'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-600" />
            <span>Smart Auto-Assignment</span>
          </button>

          <button
            onClick={() => setActiveTab('coach')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'coach'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-rose-500" />
            <span>Family Advice & Age Milestones</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: SMART ASSIGNER */}
          {activeTab === 'assigner' && (
            <div className="space-y-6">
              
              {/* Configuration Controls */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Optimization Goal</span>
                  </span>
                  <span className="text-xs text-slate-400">{members.length} Members • {chores.length} Chores</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFocusGoal('balanced_developmental')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      focusGoal === 'balanced_developmental'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 mb-0.5">🌱 Age & Development</div>
                    <p className="text-[11px] text-slate-500 leading-tight">Matches chores to pediatric motor & cognitive age milestones.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFocusGoal('skill_building')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      focusGoal === 'skill_building'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 mb-0.5">⭐ Skill Building</div>
                    <p className="text-[11px] text-slate-500 leading-tight">Assigns stretch tasks to teach new household life skills.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFocusGoal('rotation')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      focusGoal === 'rotation'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 mb-0.5">🔄 Fair Rotation</div>
                    <p className="text-[11px] text-slate-500 leading-tight">Rotates rooms to prevent chore boredom and keep tasks fresh.</p>
                  </button>
                </div>

                {/* Additional checkboxes */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeParents}
                      onChange={(e) => setIncludeParents(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Include adult parents in daily routine chore assignments</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Scope:</span>
                    <select
                      value={targetScope}
                      onChange={(e) => setTargetScope(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      <option value="all">All {chores.length} Chores</option>
                      <option value="unassigned_only">Unassigned Chores Only</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAssignments}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Gemini is analyzing ages, milestones, and workloads...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Generate AI Age-Appropriate Assignments</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <span className="font-bold">Error: </span>
                  {error}
                </div>
              )}

              {/* AI RESULTS DISPLAY */}
              {aiResult && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Fairness Rating & Summary Card */}
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-amber-50/40 rounded-2xl p-5 border border-indigo-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">AI Fairness & Developmental Assessment</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {aiResult.fairnessRating}/100 Balanced
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {aiResult.fairnessSummary}
                    </p>

                    {/* Member Insights Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-100">
                      {aiResult.ageTierInsights.map((insight) => (
                        <div key={insight.memberId} className="bg-white/80 rounded-xl p-2.5 border border-indigo-100 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span>{insight.memberName} {insight.age ? `(${insight.age}y)` : ''}</span>
                            <span className="text-[10px] text-amber-700 font-extrabold">{insight.assignedChoresCount} chores • {insight.totalPoints} pts</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">{insight.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Proposed Assignments Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Proposed Chore Assignments ({aiResult.suggestions.length})
                      </h4>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => toggleSelectAll(true)}
                          className="text-indigo-600 hover:underline font-semibold"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => toggleSelectAll(false)}
                          className="text-slate-500 hover:underline font-semibold"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      {aiResult.suggestions.map((suggestion) => {
                        const chore = chores.find(c => c.id === suggestion.choreId);
                        const member = members.find(m => m.id === suggestion.assignedMemberId);
                        const currentMember = chore ? members.find(m => m.id === chore.assignedMemberId) : null;
                        const isChecked = selectedChoreIds[suggestion.choreId] !== false;

                        return (
                          <div
                            key={suggestion.choreId}
                            className={`p-4 transition-colors flex items-start gap-3.5 ${
                              isChecked ? 'bg-white' : 'bg-slate-50 opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setSelectedChoreIds({
                                ...selectedChoreIds,
                                [suggestion.choreId]: e.target.checked,
                              })}
                              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <span className="text-sm font-bold text-slate-900 truncate">
                                  {suggestion.choreTitle}
                                </span>

                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  🎯 {suggestion.developmentalFocus}
                                </span>
                              </div>

                              {/* Assignee comparison */}
                              <div className="flex items-center gap-2 text-xs font-semibold my-1.5">
                                <span className="text-slate-400">Current: {currentMember ? currentMember.name : 'Unassigned'}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-slate-900 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  <span>{member?.avatarEmoji || '👤'}</span>
                                  <span>{suggestion.assignedMemberName}</span>
                                  {member?.age && <span className="text-slate-500 font-normal">({member.age} yrs)</span>}
                                </span>
                              </div>

                              {/* AI Reason */}
                              <p className="text-xs text-slate-600 mt-1">
                                <span className="font-semibold text-slate-700">Why this fits: </span>
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Actions */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply Selected AI Assignments</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: AI FAMILY ADVICE & COACH */}
          {activeTab === 'coach' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-5 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Gemini Household Advisor & Age Guide</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ask any questions about chore allowances, teaching habits to stubborn toddlers, or designing age-appropriate routines.
                </p>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCoachQuestion(q)}
                      className="text-[11px] font-medium bg-white hover:bg-rose-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors text-left"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question input */}
              <form onSubmit={handleAskCoach} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Ask Gemini Parenting & Chore Coach:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. How do I split chores between an 8-year-old and 13-year-old fairly?"
                      value={coachQuestion}
                      onChange={(e) => setCoachQuestion(e.target.value)}
                      className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isCoachLoading || !coachQuestion.trim()}
                      className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {isCoachLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                      <span>Ask AI</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Answer display */}
              {coachAnswer && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b pb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Coach Guidance</span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2 whitespace-pre-wrap leading-relaxed">
                    {coachAnswer}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
