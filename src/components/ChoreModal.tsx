import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Award, 
  Tag, 
  HelpCircle,
  Wand2,
  RefreshCw,
  User,
  Users,
  CalendarDays,
  ArrowRightLeft,
  RotateCw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chore, ChoreCategory, ChoreFrequency, HouseholdMember, TimeOfDay } from '../types';
import { ThemePreset, THEMES } from '../utils/theme';
import { soundFX } from '../utils/audio';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { BottomSheetGrabber } from './BottomSheetGrabber';

interface ChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  choreToEdit: Chore | null;
  members: HouseholdMember[];
  currentTheme?: ThemePreset;
  onSaveChore: (choreData: Omit<Chore, 'id'> & { id?: string }) => void;
}

const DEFAULT_CHECKLIST = [
  'Put all items in their proper storage spot',
  'Wipe surfaces clean and dry',
];

const CATEGORY_SUGGESTIONS: Record<ChoreCategory, string[]> = {
  'Kitchen': ['Wipe counters & dry edges', 'Clean sink basin & faucet', 'Dishes put in cupboards', 'Take out trash & new liner'],
  'Living Room': ['Fluff couch pillows & fold throws', 'Clear coffee table surface', 'Put remotes in charging tray', 'Floor clear of clutter'],
  'Bedrooms': ['Pillows fluffed at head of bed', 'Comforter pulled smooth', 'Floor clear of clothes/toys', 'Dirty clothes in hamper'],
  'Bathrooms': ['Sink free of toothpaste smears', 'Mirror wiped streak-free', 'Fresh hand towel hung neatly', 'Floor bath mat shaken out'],
  'Pets': ['Fresh water bowl filled', 'Food bowl measured correctly', 'Bowl area wiped clean', 'Pet toys returned to basket'],
  'Laundry': ['Clothes folded neatly by category', 'Items placed in correct drawers', 'Hamper returned to room', 'Hangers organized'],
  'Yard & Outdoor': ['Tools returned to shed', 'Gate latched securely', 'Patio swept clean', 'Hose coiled neatly'],
  'Daily Routine': ['Backpack ready with water bottle', 'Shoes lined up neatly', 'Bed made with pillows on top', 'Lights turned off'],
  'General': ['Items returned to proper spots', 'Surface wiped clean and dry', 'Floor clear of clutter', 'Inspected with pride'],
};

export const ChoreModal: React.FC<ChoreModalProps> = ({
  isOpen,
  onClose,
  choreToEdit,
  members,
  currentTheme = 'rose',
  onSaveChore,
}) => {
  const { sheetStyle, dragHandleProps, handleDismiss } = useBottomSheet({
    onClose,
    threshold: 60,
  });

  const theme = THEMES[currentTheme] || THEMES.rose;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChoreCategory>('Kitchen');
  
  // Assignment State
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'by_day'>('single');
  const [assignedMemberId, setAssignedMemberId] = useState<string>(members[0]?.id || 'unassigned');
  const [dayAssignments, setDayAssignments] = useState<{ [day: number]: string }>({});

  const [frequency, setFrequency] = useState<ChoreFrequency>('daily');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [scheduledTime, setScheduledTime] = useState<string>('08:00');
  const [defaultPoints, setDefaultPoints] = useState<number>(15);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qualityChecklist, setQualityChecklist] = useState<string[]>(DEFAULT_CHECKLIST);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);
  const [isDraftingChecklist, setIsDraftingChecklist] = useState(false);
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(true);
  const [inspectionTip, setInspectionTip] = useState<string | null>(null);
  const [aiDraftBanner, setAiDraftBanner] = useState<string | null>(null);

  // Helper rotation quick selector state
  const [rotateHelperA, setRotateHelperA] = useState<string>(members[0]?.id || '');
  const [rotateHelperB, setRotateHelperB] = useState<string>(members[1]?.id || members[0]?.id || '');

  useEffect(() => {
    if (choreToEdit) {
      setTitle(choreToEdit.title);
      setDescription(choreToEdit.description);
      setCategory(choreToEdit.category);
      setAssignedMemberId(choreToEdit.assignedMemberId);
      setFrequency(choreToEdit.frequency);
      setScheduledDays(choreToEdit.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
      setTimeOfDay(choreToEdit.timeOfDay || 'morning');
      setScheduledTime(choreToEdit.scheduledTime || '08:00');
      setDefaultPoints(choreToEdit.defaultPoints);
      setEstimatedMinutes(choreToEdit.estimatedMinutes || 15);
      setDifficulty(choreToEdit.difficulty || 'medium');
      setQualityChecklist(choreToEdit.qualityChecklist || []);
      setInspectionTip(null);
      setAiDraftBanner(null);

      if (choreToEdit.dayAssignments && Object.keys(choreToEdit.dayAssignments).length > 0) {
        setAssignmentMode('by_day');
        setDayAssignments(choreToEdit.dayAssignments);
      } else {
        setAssignmentMode('single');
        setDayAssignments({});
      }
    } else {
      setTitle('');
      setDescription('');
      setCategory('Kitchen');
      setAssignedMemberId(members[0]?.id || 'unassigned');
      setFrequency('daily');
      setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
      setTimeOfDay('morning');
      setScheduledTime('08:00');
      setDefaultPoints(15);
      setEstimatedMinutes(15);
      setDifficulty('medium');
      setQualityChecklist(DEFAULT_CHECKLIST);
      setInspectionTip(null);
      setAiDraftBanner(null);
      setAssignmentMode('single');
      setDayAssignments({});
    }
  }, [choreToEdit, members]);

  if (!isOpen) return null;

  const dayLabels = [
    { num: 0, short: 'Sun', full: 'Sunday' },
    { num: 1, short: 'Mon', full: 'Monday' },
    { num: 2, short: 'Tue', full: 'Tuesday' },
    { num: 3, short: 'Wed', full: 'Wednesday' },
    { num: 4, short: 'Thu', full: 'Thursday' },
    { num: 5, short: 'Fri', full: 'Friday' },
    { num: 6, short: 'Sat', full: 'Saturday' },
  ];

  const toggleDay = (dayIndex: number) => {
    soundFX.playPop();
    if (scheduledDays.includes(dayIndex)) {
      if (scheduledDays.length > 1) {
        const next = scheduledDays.filter(d => d !== dayIndex);
        setScheduledDays(next);
        if (assignmentMode === 'by_day') {
          const nextDayAssign = { ...dayAssignments };
          delete nextDayAssign[dayIndex];
          setDayAssignments(nextDayAssign);
        }
      }
    } else {
      const next = [...scheduledDays, dayIndex].sort();
      setScheduledDays(next);
      if (assignmentMode === 'by_day') {
        setDayAssignments({
          ...dayAssignments,
          [dayIndex]: assignedMemberId !== 'unassigned' ? assignedMemberId : (members[0]?.id || 'unassigned'),
        });
      }
    }
  };

  const handleSetDayAssignee = (dayIndex: number, memberId: string) => {
    soundFX.playPop();
    if (memberId === 'off') {
      const next = { ...dayAssignments };
      delete next[dayIndex];
      setDayAssignments(next);
      if (scheduledDays.includes(dayIndex) && scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter(d => d !== dayIndex));
      }
    } else {
      setDayAssignments({
        ...dayAssignments,
        [dayIndex]: memberId,
      });
      if (!scheduledDays.includes(dayIndex)) {
        setScheduledDays([...scheduledDays, dayIndex].sort());
      }
    }
  };

  // Quick preset: Alternate between 2 helpers
  const handleApplyAlternatingPreset = () => {
    if (!rotateHelperA || !rotateHelperB) return;
    soundFX.playPop();
    const updated: { [day: number]: string } = {};
    const activeDays = scheduledDays.length > 0 ? scheduledDays : [0, 1, 2, 3, 4, 5, 6];
    
    activeDays.forEach((day, index) => {
      updated[day] = index % 2 === 0 ? rotateHelperA : rotateHelperB;
    });

    setDayAssignments(updated);
    const nameA = members.find(m => m.id === rotateHelperA)?.name || 'Helper 1';
    const nameB = members.find(m => m.id === rotateHelperB)?.name || 'Helper 2';
    setAiDraftBanner(`✨ Alternating rotation set: ${nameA} ↔ ${nameB}`);
    setTimeout(() => setAiDraftBanner(null), 5000);
  };

  // Quick preset: Rotate across all kids/teens
  const handleApplyRotateAllKids = () => {
    const kids = members.filter(m => m.role === 'child' || m.role === 'teen');
    const pool = kids.length > 0 ? kids : members;
    if (pool.length === 0) return;
    
    soundFX.playPop();
    const updated: { [day: number]: string } = {};
    const activeDays = scheduledDays.length > 0 ? scheduledDays : [0, 1, 2, 3, 4, 5, 6];
    
    activeDays.forEach((day, index) => {
      updated[day] = pool[index % pool.length].id;
    });

    setDayAssignments(updated);
    setAiDraftBanner(`✨ Rotated chore evenly across ${pool.length} helpers!`);
    setTimeout(() => setAiDraftBanner(null), 5000);
  };

  // Switch to Day-by-Day mode
  const handleEnableDayAssignments = () => {
    soundFX.playPop();
    setAssignmentMode('by_day');
    if (Object.keys(dayAssignments).length === 0) {
      const initial: { [day: number]: string } = {};
      const activeDays = scheduledDays.length > 0 ? scheduledDays : [0, 1, 2, 3, 4, 5, 6];
      activeDays.forEach(d => {
        initial[d] = assignedMemberId !== 'unassigned' ? assignedMemberId : (members[0]?.id || 'unassigned');
      });
      setDayAssignments(initial);
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    soundFX.playPop();
    setQualityChecklist([...qualityChecklist, newChecklistItem.trim()]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    soundFX.playPop();
    setQualityChecklist(qualityChecklist.filter((_, i) => i !== index));
  };

  const targetMember = members.find(m => m.id === assignedMemberId);

  // Dedicated AI Quality Inspection Checklist Drafter
  const handleAIDraftChecklist = async (isAutoTrigger = false) => {
    const currentTitle = title.trim();
    if (!currentTitle) {
      if (!isAutoTrigger) {
        alert('Please enter a chore title first (e.g. "Clean Bathroom Sink" or "Fold Laundry").');
      }
      return;
    }

    if (!isAutoTrigger) soundFX.playPop();
    setIsDraftingChecklist(true);

    try {
      const response = await fetch('/api/ai/draft-quality-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          category,
          description: description.trim(),
          difficulty,
          targetMemberName: targetMember?.name,
          targetAge: targetMember?.age,
          memberRole: targetMember?.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.qualityChecklist && Array.isArray(data.qualityChecklist) && data.qualityChecklist.length > 0) {
          setQualityChecklist(data.qualityChecklist);
          if (data.inspectionTip) {
            setInspectionTip(data.inspectionTip);
          }
          if (data.suggestedPoints && (!choreToEdit || isAutoTrigger)) {
            setDefaultPoints(data.suggestedPoints);
          }
          if (data.suggestedMinutes && (!choreToEdit || isAutoTrigger)) {
            setEstimatedMinutes(data.suggestedMinutes);
          }
          if (data.suggestedDifficulty && (!choreToEdit || isAutoTrigger)) {
            setDifficulty(data.suggestedDifficulty);
          }
          
          soundFX.playRewardCoin();
          setAiDraftBanner(`✨ AI drafted ${data.qualityChecklist.length} quality inspection criteria for "${currentTitle}"!`);
          setTimeout(() => setAiDraftBanner(null), 6000);
        }
      }
    } catch (err) {
      console.warn('AI Draft Checklist error:', err);
    } finally {
      setIsDraftingChecklist(false);
    }
  };

  // Triggered on Title input blur for automatic drafting
  const handleTitleBlur = () => {
    if (!autoDraftEnabled) return;
    const currentTitle = title.trim();
    if (currentTitle.length >= 3 && !isDraftingChecklist && !isAIEnhancing) {
      const isDefaultOrEmpty = 
        qualityChecklist.length === 0 || 
        (qualityChecklist.length === DEFAULT_CHECKLIST.length && 
         qualityChecklist.every((item, i) => item === DEFAULT_CHECKLIST[i]));

      if (isDefaultOrEmpty) {
        handleAIDraftChecklist(true);
      }
    }
  };

  // Full AI Autofill / Enhancement
  const handleAIEnhanceChore = async () => {
    soundFX.playPop();
    setIsAIEnhancing(true);

    try {
      const response = await fetch('/api/ai/generate-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: title.trim() || `Practical chore for ${category}`,
          roomCategory: category,
          count: 1,
          targetMemberName: targetMember?.name,
          targetAge: targetMember?.age,
          memberRole: targetMember?.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chores && data.chores.length > 0) {
          const generated = data.chores[0];
          if (!title.trim()) setTitle(generated.title);
          setDescription(generated.description);
          setCategory(generated.category || category);
          setDifficulty(generated.difficulty || difficulty);
          setDefaultPoints(generated.defaultPoints || defaultPoints);
          setEstimatedMinutes(generated.estimatedMinutes || estimatedMinutes);
          if (generated.qualityChecklist && generated.qualityChecklist.length > 0) {
            setQualityChecklist(generated.qualityChecklist);
          }
          if (generated.rationale) {
            setInspectionTip(generated.rationale);
          }
          soundFX.playRewardCoin();
          setAiDraftBanner(`✨ AI populated chore details and quality inspection criteria!`);
          setTimeout(() => setAiDraftBanner(null), 6000);
        }
      }
    } catch (err) {
      console.warn('AI Enhance Chore error:', err);
    } finally {
      setIsAIEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a chore title.');
      return;
    }

    const effectiveDayAssignments = assignmentMode === 'by_day' && Object.keys(dayAssignments).length > 0
      ? dayAssignments
      : undefined;

    const effectiveScheduledDays = assignmentMode === 'by_day' && effectiveDayAssignments
      ? Object.keys(effectiveDayAssignments).map(Number).sort((a, b) => a - b)
      : (frequency === 'custom_days' || frequency === 'weekly' ? scheduledDays : [0, 1, 2, 3, 4, 5, 6]);

    const primaryAssignee = assignmentMode === 'by_day' && effectiveDayAssignments
      ? (Object.values(effectiveDayAssignments)[0] || assignedMemberId)
      : assignedMemberId;

    soundFX.playPop();
    onSaveChore({
      id: choreToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      assignedMemberId: primaryAssignee,
      dayAssignments: effectiveDayAssignments,
      frequency: assignmentMode === 'by_day' ? 'custom_days' : frequency,
      scheduledDays: effectiveScheduledDays,
      timeOfDay,
      scheduledTime,
      defaultPoints: Number(defaultPoints) || 10,
      estimatedMinutes: Number(estimatedMinutes) || 15,
      difficulty,
      qualityChecklist,
      isActive: choreToEdit ? choreToEdit.isActive : true,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <motion.div 
        style={sheetStyle}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="relative w-full max-w-xl bg-white rounded-t-[32px] sm:rounded-[28px] border-t sm:border border-slate-200/90 shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col z-10 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Grabber Touch Bar */}
        <BottomSheetGrabber dragHandleProps={dragHandleProps} onClose={handleDismiss} />

        {/* Navigation Bar Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md shrink-0">
          <div 
            className="flex items-center space-x-3 flex-1 min-w-0 select-none cursor-grab active:cursor-grabbing"
            onTouchStart={dragHandleProps.onTouchStart}
            onTouchMove={dragHandleProps.onTouchMove}
            onTouchEnd={dragHandleProps.onTouchEnd}
            onPointerDown={dragHandleProps.onPointerDown}
            onPointerMove={dragHandleProps.onPointerMove}
            onPointerUp={dragHandleProps.onPointerUp}
          >
            <div className={`w-9 h-9 rounded-2xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center text-sm font-black shadow-xs shrink-0`}>
              📝
            </div>
            <div className="min-w-0 truncate">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                {choreToEdit ? 'Edit Chore Template' : 'New Chore Template'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Schedule, assignees & quality standards
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
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer min-h-[38px] min-w-[38px] shrink-0 z-20"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
            
            {/* AI Draft Alert Banner */}
            <AnimatePresence>
              {aiDraftBanner && (
                <motion.div 
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="truncate">{aiDraftBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiDraftBanner(null)}
                    className="text-purple-500 hover:text-purple-900 text-xs p-1 min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title & AI Autofill */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                  Chore Name & Action
                </label>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleAIEnhanceChore}
                  disabled={isAIEnhancing || isDraftingChecklist}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 cursor-pointer transition-all active:scale-95 disabled:opacity-50 min-h-[36px] shrink-0"
                >
                  {isAIEnhancing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI Filling...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>✨ AI Smart Autofill</span>
                    </>
                  )}
                </motion.button>
              </div>

              <input
                id="input-chore-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="e.g. Empty & Reload Dishwasher"
                className="w-full text-sm font-bold p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all min-h-[48px] shadow-2xs"
              />
              <p className="text-[10px] text-slate-400 font-medium pl-1">
                💡 Type a name like "Clean Bathroom Sink" to automatically draft inspection criteria.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Detailed Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Clear instructions for the helper..."
                className="w-full text-xs font-medium p-3 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all shadow-2xs"
              />
            </div>

            {/* Category / Room & Time of Day */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Room / Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ChoreCategory)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                  >
                    <option value="Kitchen">🍳 Kitchen</option>
                    <option value="Living Room">🛋️ Living Room</option>
                    <option value="Bedrooms">🛏️ Bedrooms</option>
                    <option value="Bathrooms">🚿 Bathrooms</option>
                    <option value="Pets">🐾 Pets</option>
                    <option value="Laundry">🧺 Laundry</option>
                    <option value="Yard & Outdoor">🌿 Yard & Outdoor</option>
                    <option value="Daily Routine">☀️ Daily Routine</option>
                    <option value="General">📦 General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Time of Day
                  </label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                  >
                    <option value="morning">🌅 Morning (Before School)</option>
                    <option value="afternoon">☀️ Afternoon (After School)</option>
                    <option value="evening">🌆 Evening (Dinner Time)</option>
                    <option value="bedtime">🌙 Bedtime Routine</option>
                    <option value="anytime">⏰ Flexible / Anytime</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Helper Assignment & Scheduling Section (Supports Multi-Person by Day) */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                    Helper Assignment & Schedule
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Assign a single helper or rotate different people on different days
                  </p>
                </div>

                {/* Apple HIG Segmented Control */}
                <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl border border-slate-300/60 w-full gap-1">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setAssignmentMode('single');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 ${
                      assignmentMode === 'single'
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Single Helper</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={handleEnableDayAssignments}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 ${
                      assignmentMode === 'by_day'
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-rose-500" />
                    <span>Assign by Day</span>
                  </motion.button>
                </div>
              </div>

              {/* Mode A: Single Assigned Helper */}
              {assignmentMode === 'single' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Assigned Helper
                      </label>
                      <select
                        value={assignedMemberId}
                        onChange={(e) => setAssignedMemberId(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                      >
                        <option value="unassigned">🤝 Anyone / Unassigned</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.avatarEmoji} {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                      >
                        <option value="daily">📅 Every Day</option>
                        <option value="weekdays">🎒 Mon – Fri (School Days)</option>
                        <option value="weekends">🎉 Sat & Sun (Weekends)</option>
                        <option value="weekly">🗓️ Weekly (Specific Day)</option>
                        <option value="custom_days">⚙️ Selected Days</option>
                      </select>
                    </div>
                  </div>

                  {(frequency === 'custom_days' || frequency === 'weekly') && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                        Active Schedule Days:
                      </span>
                      <div className="grid grid-cols-7 gap-1 w-full">
                        {dayLabels.map((day) => {
                          const isSelected = scheduledDays.includes(day.num);
                          return (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              key={day.num}
                              type="button"
                              onClick={() => toggleDay(day.num)}
                              className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {day.short}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Assign Different People on Different Days */}
              {assignmentMode === 'by_day' && (
                <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs w-full overflow-hidden">
                  
                  {/* Quick Preset Card - Refined to prevent any bounding box overflow */}
                  <div className="bg-rose-50/80 border border-rose-200/80 p-3 rounded-2xl space-y-2.5 w-full">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">
                        Quick Rotation Presets
                      </span>
                    </div>
                    
                    {/* Preset 1: Alternate 2 helpers */}
                    <div className="bg-white p-2.5 rounded-xl border border-rose-200 space-y-2 w-full shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Alternate 2 Helpers:</span>
                        <span className="text-[10px] text-slate-400 font-medium">Takes turns every day</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <div className="min-w-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Helper 1</label>
                          <select
                            value={rotateHelperA}
                            onChange={(e) => setRotateHelperA(e.target.value)}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 min-h-[38px] truncate"
                          >
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.avatarEmoji} {m.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="min-w-0">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Helper 2</label>
                          <select
                            value={rotateHelperB}
                            onChange={(e) => setRotateHelperB(e.target.value)}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 min-h-[38px] truncate"
                          >
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.avatarEmoji} {m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleApplyAlternatingPreset}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 min-h-[38px]"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Apply Alternating Schedule</span>
                      </motion.button>
                    </div>

                    {/* Preset 2: Rotate All Kids */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={handleApplyRotateAllKids}
                      className="w-full py-2.5 px-3 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2 min-h-[40px]"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Rotate Across All Kids & Teens</span>
                    </motion.button>
                  </div>

                  {/* Day-by-Day Schedule Matrix */}
                  <div className="space-y-2 pt-1 w-full">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                      Assign helper for each day of the week:
                    </span>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                      {dayLabels.map((day) => {
                        const currentAssigneeId = dayAssignments[day.num] || 'off';
                        const isOff = currentAssigneeId === 'off';

                        return (
                          <div 
                            key={day.num}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-colors w-full ${
                              !isOff 
                                ? 'bg-slate-50/90 border-slate-200/90' 
                                : 'bg-slate-100/60 border-dashed border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="shrink-0 flex items-center gap-1.5 min-w-[72px]">
                              <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                !isOff ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {day.short}
                              </span>
                              <span className="font-bold text-slate-700 text-xs hidden sm:inline truncate">
                                {day.full}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <select
                                value={currentAssigneeId}
                                onChange={(e) => handleSetDayAssignee(day.num, e.target.value)}
                                className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[42px] truncate"
                              >
                                <option value="off">🚫 Rest / Off (No Chore)</option>
                                <option value="unassigned">🤝 Anyone / Open</option>
                                {members.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.avatarEmoji} {m.name} ({m.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inset Group: Points, Minutes & Difficulty */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                    ⭐ Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={defaultPoints}
                    onChange={(e) => setDefaultPoints(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white text-amber-900 focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                    ⏱️ Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                  >
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Med</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quality Checklist Inset */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>Quality Inspection Checklist</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {qualityChecklist.length} steps
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Observable standards verified during parent sign-off
                  </p>
                </div>

                {/* AI Draft Checklist Button */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleAIDraftChecklist(false)}
                  disabled={isDraftingChecklist || !title.trim()}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs min-h-[40px] shrink-0 ${
                    isDraftingChecklist 
                      ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                      : !title.trim()
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                  }`}
                  title={!title.trim() ? 'Enter a chore name first to draft checklist' : 'Use Gemini AI to draft inspection criteria'}
                >
                  {isDraftingChecklist ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Drafting Checklist...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>🪄 AI Draft Checklist</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Auto-Draft Toggle Pill */}
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Auto-draft checklist when chore is named</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAutoDraftEnabled(!autoDraftEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                    autoDraftEnabled ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={autoDraftEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoDraftEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Inspection Tip Card if provided by AI */}
              {inspectionTip && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
                  <span className="text-base shrink-0">💡</span>
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-extrabold text-[11px] uppercase tracking-wide text-amber-800 block">
                      Inspection Tip for Parents:
                    </span>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      {inspectionTip}
                    </p>
                  </div>
                </div>
              )}

              {/* Checklist Items List */}
              {qualityChecklist.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-5 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    No inspection criteria added yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAIDraftChecklist(false)}
                    disabled={!title.trim()}
                    className="text-xs font-extrabold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate quality steps with AI</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {qualityChecklist.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2.5 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-black text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-slate-800 font-medium leading-relaxed break-words min-w-0">
                        {item}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => handleRemoveChecklistItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-2 cursor-pointer transition-colors rounded-lg hover:bg-rose-50 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                        title="Remove step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Room Suggestions Pills */}
              {CATEGORY_SUGGESTIONS[category] && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Quick suggestions for {category}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_SUGGESTIONS[category].map((suggestion, sIdx) => {
                      const alreadyAdded = qualityChecklist.includes(suggestion);
                      if (alreadyAdded) return null;
                      return (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            setQualityChecklist([...qualityChecklist, suggestion]);
                          }}
                          className="text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs min-h-[34px]"
                        >
                          <span className="text-emerald-600 font-bold">+</span>
                          <span>{suggestion}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom Item Row */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. Wipe corners & dry counter"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 text-xs p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-rose-500 min-h-[44px] min-w-0"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-4 py-2.5 bg-slate-200/90 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer min-h-[44px] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </motion.button>
              </div>
            </div>

          </div>

          {/* Sticky Actions Footer */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md flex items-center justify-end gap-2.5 shrink-0 safe-area-pb">
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors min-h-[44px] cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              id="btn-save-chore"
              type="submit"
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl text-xs sm:text-sm font-black ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} shadow-sm transition-all cursor-pointer min-h-[44px]`}
            >
              {choreToEdit ? 'Save Changes' : 'Create Chore Template'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};


