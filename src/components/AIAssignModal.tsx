import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  ArrowRight, 
  Sliders, 
  RefreshCw, 
  HelpCircle, 
  MessageSquare, 
  ChevronRight, 
  Award, 
  Zap, 
  Plus, 
  Check, 
  ListTodo, 
  Wand2, 
  Flame, 
  Home, 
  Calendar 
} from 'lucide-react';
import { HouseholdMember, Chore, AIAssignmentResult, AIAssignmentSuggestion, ChoreCategory } from '../types';
import { getMemberEffectiveAge } from '../utils/age';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { soundFX } from '../utils/audio';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface GeneratedChoreTemplate {
  title: string;
  description: string;
  category: ChoreCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  defaultPoints: number;
  estimatedMinutes: number;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom_days';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'anytime';
  scheduledTime: string;
  qualityChecklist: string[];
  rationale?: string;
}

interface AIAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  chores: Chore[];
  currentTheme?: ThemePreset;
  onApplyAssignments: (assignments: { choreId: string; assignedMemberId: string }[]) => void;
  onAddGeneratedChores?: (newChores: GeneratedChoreTemplate[]) => void;
  initialTab?: 'assigner' | 'creator' | 'coach';
}

export const AIAssignModal: React.FC<AIAssignModalProps> = ({
  isOpen,
  onClose,
  members,
  chores,
  currentTheme = 'rose',
  onApplyAssignments,
  onAddGeneratedChores,
  initialTab = 'assigner',
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 60,
  });

  const [activeTab, setActiveTab] = useState<'assigner' | 'creator' | 'coach'>(initialTab);
  
  // Assigner tab state
  const [focusGoal, setFocusGoal] = useState<'balanced_developmental' | 'skill_building' | 'rotation'>('balanced_developmental');
  const [includeParents, setIncludeParents] = useState<boolean>(false);
  const [targetScope, setTargetScope] = useState<'all' | 'unassigned_only'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAssignmentResult | null>(null);
  const [selectedChoreIds, setSelectedChoreIds] = useState<{ [choreId: string]: boolean }>({});

  // Creator tab state
  const [creatorPrompt, setCreatorPrompt] = useState('');
  const [creatorRoom, setCreatorRoom] = useState<string>('Kitchen');
  const [creatorTargetMemberId, setCreatorTargetMemberId] = useState<string>('all');
  const [isGeneratingChores, setIsGeneratingChores] = useState(false);
  const [generatedChores, setGeneratedChores] = useState<GeneratedChoreTemplate[]>([]);
  const [selectedGeneratedIdxs, setSelectedGeneratedIdxs] = useState<{ [index: number]: boolean }>({});
  const [creatorError, setCreatorError] = useState<string | null>(null);

  // AI Coach state
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  if (!isOpen) return null;
  const theme = THEMES[currentTheme] || THEMES.rose;

  const handleGenerateAssignments = async () => {
    soundFX.playPop();
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
      soundFX.playRewardCoin();

      const initialSelected: { [id: string]: boolean } = {};
      data.suggestions.forEach(s => {
        initialSelected[s.choreId] = true;
      });
      setSelectedChoreIds(initialSelected);
    } catch (err: any) {
      console.error('Error generating AI assignments:', err);
      setError(err.message || 'Failed to generate assignments. Please verify server connection.');
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

    soundFX.playStarChime(5);
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

  // Generate new chore templates using AI
  const handleAIGenerateChores = async () => {
    soundFX.playPop();
    setIsGeneratingChores(true);
    setCreatorError(null);

    const targetMember = members.find(m => m.id === creatorTargetMemberId);

    try {
      const response = await fetch('/api/ai/generate-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: creatorPrompt.trim() || `Practical family chores for ${creatorRoom}`,
          roomCategory: creatorRoom,
          targetAge: targetMember ? getMemberEffectiveAge(targetMember) : undefined,
          targetMemberName: targetMember?.name,
          memberRole: targetMember?.role,
          count: 3,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate chores with AI');
      }

      const data = await response.json();
      if (data.chores && Array.isArray(data.chores)) {
        setGeneratedChores(data.chores);
        soundFX.playRewardCoin();
        const initialSelected: { [idx: number]: boolean } = {};
        data.chores.forEach((_: any, i: number) => {
          initialSelected[i] = true;
        });
        setSelectedGeneratedIdxs(initialSelected);
      }
    } catch (err: any) {
      console.error('AI Chore Creator error:', err);
      setCreatorError(err.message || 'Failed to create chores with AI.');
    } finally {
      setIsGeneratingChores(false);
    }
  };

  const handleApplyGeneratedChores = () => {
    const selected = generatedChores.filter((_, idx) => selectedGeneratedIdxs[idx] !== false);
    if (selected.length === 0) {
      alert('Please select at least one chore to add.');
      return;
    }
    if (onAddGeneratedChores) {
      onAddGeneratedChores(selected);
    }
    onClose();
  };

  // AI Coach query handler
  const handleAskCoach = async (qText?: string) => {
    const textToSend = qText || coachQuestion;
    if (!textToSend.trim()) return;

    soundFX.playPop();
    setIsCoachLoading(true);
    setCoachAnswer(null);

    try {
      const response = await fetch('/api/ai/chore-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          members: members.map(m => ({
            name: m.name,
            role: m.role,
            age: getMemberEffectiveAge(m),
            points: m.currentPoints,
          })),
          chores: chores.map(c => ({
            title: c.title,
            category: c.category,
            points: c.defaultPoints,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get coaching advice.');
      }

      const data = await response.json();
      setCoachAnswer(data.advice || 'No advice received.');
      soundFX.playRewardCoin();
    } catch (err: any) {
      setCoachAnswer(`Could not load coach response: ${err.message}`);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const roomsList: ChoreCategory[] = [
    'Kitchen', 'Living Room', 'Bedrooms', 'Bathrooms', 'Pets', 'Laundry', 'Yard & Outdoor', 'Daily Routine', 'General'
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto ${isGlassTheme(currentTheme) ? (THEMES[currentTheme].isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white/30 backdrop-blur-md') : 'bg-slate-950/60 '} flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200`}
      onClick={handleDismiss}
    >
      <div 
        style={sheetStyle}
        className={`relative w-full max-w-2xl rounded-t-[32px] sm:rounded-[28px] border-t sm:border shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-300 safe-area-pb ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/20' : 'bg-white dark:bg-slate-800 dark:bg-slate-900 border-slate-200 dark:border-slate-700/90 dark:border-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch Bar */}
        <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />

        {/* Navigation Bar Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${isGlassTheme(currentTheme) ? 'bg-transparent border-white/20' : 'bg-slate-50 dark:bg-slate-900/70 border-slate-100 dark:border-slate-700 '}`}>
          <div 
            className="flex items-center space-x-2.5 flex-1 min-w-0 select-none cursor-grab active:cursor-grabbing"
            onTouchStart={dragHandleProps.onTouchStart}
            onPointerDown={dragHandleProps.onPointerDown}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0 truncate">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                AI Smart Assistant
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium truncate">
                Gemini 3.7 Flash · Age & Workload Intelligence
              </p>
            </div>
          </div>
          
          <button
            type="button"
            data-no-drag="true"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              soundFX.playPop();
              handleDismiss();
            }}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer min-h-[36px] min-w-[36px] shrink-0 z-20"
            title="Close Assistant"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Apple HIG Segmented Control */}
        <div className={`px-4 pt-3 pb-2 shrink-0 ${isGlassTheme(currentTheme) ? 'bg-transparent' : 'bg-white dark:bg-slate-800'}`}>
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <button
              onClick={() => { soundFX.playPop(); setActiveTab('assigner'); }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
                activeTab === 'assigner'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>Smart Assigner</span>
            </button>

            <button
              onClick={() => { soundFX.playPop(); setActiveTab('creator'); }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
                activeTab === 'creator'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Chore Creator</span>
            </button>

            <button
              onClick={() => { soundFX.playPop(); setActiveTab('coach'); }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
                activeTab === 'coach'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Family Coach</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: AUTO-ASSIGNER */}
          {activeTab === 'assigner' && (
            <div className="space-y-4">
              {/* Configuration Inset Card */}
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Assignment Rules & Balance Strategy
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {members.length} Helpers · {chores.length} Chores
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Focus Goal
                    </label>
                    <select
                      value={focusGoal}
                      onChange={(e) => setFocusGoal(e.target.value as any)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      <option value="balanced_developmental">🌱 Balanced & Age-Appropriate</option>
                      <option value="skill_building">🚀 Skill Building & Growth</option>
                      <option value="rotation">🔄 Fresh Variety & Fair Rotation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Target Chore Scope
                    </label>
                    <select
                      value={targetScope}
                      onChange={(e) => setTargetScope(e.target.value as any)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      <option value="all">📋 Re-evaluate All Chores</option>
                      <option value="unassigned_only">🤝 Unassigned Chores Only</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeParents}
                      onChange={(e) => setIncludeParents(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span>Include Parents in Routine Chores</span>
                  </label>

                  <button
                    onClick={handleGenerateAssignments}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 min-h-[42px] ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Family...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Run AI Assignment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
                  ⚠️ {error}
                </div>
              )}

              {/* AI Results */}
              {aiResult && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Fairness Badge & Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50/70 p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider">
                        Fairness & Developmental Rating
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                        {aiResult.fairnessRating || 95}% Balanced
                      </span>
                    </div>
                    <p className="text-xs text-purple-950 font-medium leading-relaxed">
                      "{aiResult.fairnessSummary}"
                    </p>
                  </div>

                  {/* Header for Suggestions */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Recommended Chore Assignments ({aiResult.suggestions.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectAll(true)}
                        className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => toggleSelectAll(false)}
                        className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:underline cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Suggestions List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {aiResult.suggestions.map((suggestion) => {
                      const isSelected = selectedChoreIds[suggestion.choreId] !== false;
                      const member = members.find(m => m.id === suggestion.assignedMemberId);

                      return (
                        <div
                          key={suggestion.choreId}
                          onClick={() => {
                            setSelectedChoreIds(prev => ({
                              ...prev,
                              [suggestion.choreId]: !isSelected,
                            }));
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isSelected
                              ? 'bg-purple-50/40 border-purple-300 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {suggestion.choreTitle}
                              </h4>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                                {suggestion.developmentalFocus || 'Responsibility'}
                              </span>
                            </div>

                            <p className="text-[11px] text-purple-900 font-semibold mb-1">
                              Assign to: <span className="font-extrabold">{member?.avatarEmoji} {suggestion.assignedMemberName}</span>
                            </p>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-tight">
                              {suggestion.reason}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Apply Action Bar */}
                  <div className="pt-2">
                    <button
                      onClick={handleApply}
                      className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-black shadow-md active:scale-98 transition-transform cursor-pointer flex items-center justify-center gap-2 min-h-[46px] ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply Selected AI Assignments</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI CHORE CREATOR */}
          {activeTab === 'creator' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Chore Generator Preferences
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    1-Tap Routine Builder
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    What chores do you want to create or improve?
                  </label>
                  <input
                    type="text"
                    value={creatorPrompt}
                    onChange={(e) => setCreatorPrompt(e.target.value)}
                    placeholder="e.g. Morning school prep, bathroom sanitizing, puppy care, car wash"
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Room / Area
                    </label>
                    <select
                      value={creatorRoom}
                      onChange={(e) => setCreatorRoom(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    >
                      {roomsList.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tailor to Helper (Age Appropriate)
                    </label>
                    <select
                      value={creatorTargetMemberId}
                      onChange={(e) => setCreatorTargetMemberId(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    >
                      <option value="all">👨‍👩‍👧‍👦 General Family</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.avatarEmoji} {m.name} ({getMemberEffectiveAge(m) ? `${getMemberEffectiveAge(m)} yrs` : m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAIGenerateChores}
                  disabled={isGeneratingChores}
                  className={`w-full py-2.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 min-h-[42px] flex items-center justify-center gap-1.5 ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {isGeneratingChores ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Routine Templates...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>Generate 3 Custom Chores with AI</span>
                    </>
                  )}
                </button>
              </div>

              {creatorError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
                  ⚠️ {creatorError}
                </div>
              )}

              {/* Generated Chores List */}
              {generatedChores.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Generated Chore Templates ({generatedChores.length})
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600">
                      Select which to add to Library
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {generatedChores.map((chore, idx) => {
                      const isSelected = selectedGeneratedIdxs[idx] !== false;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedGeneratedIdxs(prev => ({
                              ...prev,
                              [idx]: !isSelected,
                            }));
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isSelected
                              ? 'bg-indigo-50/40 border-indigo-300 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {chore.title}
                              </h4>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {chore.category}
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  ⭐ {chore.defaultPoints} pts
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2">
                              {chore.description}
                            </p>

                            <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2 border border-slate-200 dark:border-slate-700/80 text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 space-y-1">
                              <p className="font-bold text-slate-700">Inspection Checklist:</p>
                              <ul className="list-disc pl-3.5 space-y-0.5">
                                {chore.qualityChecklist.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleApplyGeneratedChores}
                    className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-black shadow-md active:scale-98 transition-transform cursor-pointer flex items-center justify-center gap-2 min-h-[46px] ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Selected Chores to Chore Library</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FAMILY COACH */}
          {activeTab === 'coach' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Ask the Household Coach
                </span>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAskCoach("How do I motivate kids without complaining?")}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    💡 Motivate without nagging
                  </button>
                  <button
                    onClick={() => handleAskCoach("What chores are best for a 5 year old?")}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    👶 Chores for 5-yr-olds
                  </button>
                  <button
                    onClick={() => handleAskCoach("How should we handle chore redo inspections fairly?")}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    🔍 Fair Redo inspections
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coachQuestion}
                    onChange={(e) => setCoachQuestion(e.target.value)}
                    placeholder="Ask any parenting, routine or habit question..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskCoach();
                    }}
                    className="flex-1 text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                  <button
                    onClick={() => handleAskCoach()}
                    disabled={isCoachLoading || !coachQuestion.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 cursor-pointer min-h-[44px]"
                  >
                    {isCoachLoading ? 'Thinking...' : 'Ask'}
                  </button>
                </div>
              </div>

              {coachAnswer && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-slate-800 leading-relaxed space-y-2 animate-in fade-in duration-200 shadow-2xs whitespace-pre-line">
                  <p className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Coach Guidance:</span>
                  </p>
                  <p>{coachAnswer}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
