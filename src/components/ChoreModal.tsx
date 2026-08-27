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
  Wand2
} from 'lucide-react';
import { Chore, ChoreCategory, ChoreFrequency, HouseholdMember, TimeOfDay } from '../types';

interface ChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  choreToEdit: Chore | null;
  members: HouseholdMember[];
  onSaveChore: (choreData: Omit<Chore, 'id'> & { id?: string }) => void;
}

export const ChoreModal: React.FC<ChoreModalProps> = ({
  isOpen,
  onClose,
  choreToEdit,
  members,
  onSaveChore,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChoreCategory>('Kitchen');
  const [assignedMemberId, setAssignedMemberId] = useState<string>(members[0]?.id || 'unassigned');
  const [frequency, setFrequency] = useState<ChoreFrequency>('daily');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [scheduledTime, setScheduledTime] = useState<string>('08:00');
  const [defaultPoints, setDefaultPoints] = useState<number>(15);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qualityChecklist, setQualityChecklist] = useState<string[]>([
    'Put all items in their proper places',
    'Wipe surfaces clean of dust and crumbs',
  ]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

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
      setQualityChecklist([
        'Put all items in their proper storage spot',
        'Wipe surfaces clean and dry',
      ]);
    }
  }, [choreToEdit, members]);

  // Toggle days for custom_days or weekly
  const toggleDay = (dayIndex: number) => {
    if (scheduledDays.includes(dayIndex)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter(d => d !== dayIndex));
      }
    } else {
      setScheduledDays([...scheduledDays, dayIndex].sort());
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setQualityChecklist([...qualityChecklist, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setQualityChecklist(qualityChecklist.filter((_, i) => i !== index));
  };

  const handleFrequencyChange = (freq: ChoreFrequency) => {
    setFrequency(freq);
    if (freq === 'daily') {
      setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (freq === 'weekdays') {
      setScheduledDays([1, 2, 3, 4, 5]);
    } else if (freq === 'weekends') {
      setScheduledDays([0, 6]);
    } else if (freq === 'weekly') {
      setScheduledDays([6]); // Saturday default
    }
  };

  const applyTemplatePreset = (presetKey: string) => {
    switch (presetKey) {
      case 'dishwasher':
        setTitle('Unload & Reload Dishwasher');
        setDescription('Empty clean racks into cupboards and load dirty plates from the sink.');
        setCategory('Kitchen');
        setDefaultPoints(15);
        setEstimatedMinutes(15);
        setQualityChecklist([
          'Dishes put away in correct cupboards without stacking dangerously',
          'Silverware sorted into proper tray slots',
          'Dirty sink dishes loaded with soap pod placed',
          'Kitchen sink wiped clean of food scraps',
        ]);
        break;
      case 'bedroom':
        setTitle('Tidy Bedroom & Make Bed');
        setDescription('Make bed with sheets pulled flat, pick up dirty clothes and put in hamper.');
        setCategory('Bedrooms');
        setDefaultPoints(10);
        setEstimatedMinutes(10);
        setQualityChecklist([
          'Duvet/blanket straightened flat',
          'Pillows placed at the top',
          'No toys or clothes left on the rug',
          'Dirty clothes placed in laundry basket',
        ]);
        break;
      case 'bathroom':
        setTitle('Scrub Bathroom Sink & Mirror');
        setDescription('Spray and wipe faucet, clear counter clutter, wash sink bowl.');
        setCategory('Bathrooms');
        setDefaultPoints(20);
        setEstimatedMinutes(15);
        setQualityChecklist([
          'Toothpaste splatters scrubbed off mirror and faucet',
          'Sink basin cleaned with bathroom spray',
          'Counter clutter put away in drawers',
          'Hand towel hung neatly on ring',
        ]);
        break;
      case 'trash':
        setTitle('Empty All House Waste Baskets');
        setDescription('Collect trash from bathrooms, bedrooms, and kitchen into outdoor bins.');
        setCategory('General');
        setDefaultPoints(15);
        setEstimatedMinutes(10);
        setQualityChecklist([
          'Bags tied tightly and taken to outdoor bin',
          'New trash liners fitted over each rim',
          'Cardboard crushed into recycling bin',
        ]);
        break;
      case 'pets':
        setTitle('Feed Pets & Fresh Water');
        setDescription('Clean pet bowls and refill with fresh food and cold water.');
        setCategory('Pets');
        setDefaultPoints(10);
        setEstimatedMinutes(5);
        setQualityChecklist([
          'Rinse bowl before filling fresh water',
          'Provide correct measured food scoop',
          'Wipe up any floor drips',
        ]);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveChore({
      id: choreToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      assignedMemberId,
      frequency,
      scheduledDays,
      timeOfDay,
      scheduledTime,
      defaultPoints: Number(defaultPoints) || 10,
      estimatedMinutes: Number(estimatedMinutes) || 10,
      difficulty,
      qualityChecklist,
      iconName: 'Sparkles',
      isActive: true,
    });
    onClose();
  };

  const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const categories: ChoreCategory[] = [
    'Kitchen', 'Living Room', 'Bedrooms', 'Bathrooms', 'Pets', 'Laundry', 'Yard & Outdoor', 'Daily Routine', 'General'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="chore-form-modal"
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              📝
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {choreToEdit ? 'Edit Household Chore' : 'Create New Household Chore'}
              </h2>
              <p className="text-xs text-slate-400">
                Set schedules, quality inspection criteria, and point rewards
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

        {/* Quick Presets for New Chores */}
        {!choreToEdit && (
          <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Wand2 className="w-3.5 h-3.5 text-rose-500" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => applyTemplatePreset('dishwasher')}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🍽️ Dishwasher
            </button>
            <button
              type="button"
              onClick={() => applyTemplatePreset('bedroom')}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🛏️ Tidy Room
            </button>
            <button
              type="button"
              onClick={() => applyTemplatePreset('bathroom')}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🛁 Bathroom
            </button>
            <button
              type="button"
              onClick={() => applyTemplatePreset('trash')}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🗑️ Trash Bins
            </button>
            <button
              type="button"
              onClick={() => applyTemplatePreset('pets')}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-medium text-slate-700 whitespace-nowrap"
            >
              🐶 Pet Feeding
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Chore Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Chore Name *
            </label>
            <input
              id="chore-title-input"
              type="text"
              required
              placeholder="e.g. Unload & Reload Dishwasher"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Instructions / Details
            </label>
            <textarea
              id="chore-desc-input"
              rows={2}
              placeholder="Provide simple, clear steps for how this chore should be done."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Room Category & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Room / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ChoreCategory)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Helper
              </label>
              <select
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500 font-medium"
              >
                <option value="unassigned">🤝 Unassigned / Open Pool</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatarEmoji} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency & Scheduled Days */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Recurrence Schedule
                </label>
                <select
                  value={frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value as ChoreFrequency)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekends">Weekends (Sat-Sun)</option>
                  <option value="weekly">Once a Week</option>
                  <option value="custom_days">Custom Specific Days</option>
                  <option value="as_needed">As Needed / Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Time of Day / Target Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                    className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="bedtime">Bedtime</option>
                    <option value="anytime">Anytime</option>
                  </select>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Days of Week Toggles */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Active Days of the Week:
              </label>
              <div className="flex gap-1.5">
                {daysLabels.map((day, idx) => {
                  const isSelected = scheduledDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Points & Duration & Difficulty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                ⭐ Base Points
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={defaultPoints}
                onChange={(e) => setDefaultPoints(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-amber-900 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                ⏱️ Est. Minutes
              </label>
              <input
                type="number"
                min="1"
                max="240"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          </div>

          {/* Quality Inspection Checklist Builder */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Quality Inspection Checklist (What Mom checks)
              </label>
              <span className="text-[11px] text-slate-400">
                {qualityChecklist.length} item{qualityChecklist.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2 mb-2">
              {qualityChecklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="flex-1 text-slate-800">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Wipe under microwave & dry counter"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="flex-1 text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors shrink-0"
              >
                + Add Step
              </button>
            </div>
          </div>

          {/* Footer Save Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-chore"
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              {choreToEdit ? 'Save Changes' : 'Create Chore'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
