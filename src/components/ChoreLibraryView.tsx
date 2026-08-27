import React, { useState } from 'react';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  CheckSquare, 
  Copy,
  Layers
} from 'lucide-react';
import { Chore, ChoreCategory, HouseholdMember } from '../types';
import { formatTimeDisplay } from '../utils/storage';

interface ChoreLibraryViewProps {
  chores: Chore[];
  members: HouseholdMember[];
  onOpenNewChore: () => void;
  onEditChore: (chore: Chore) => void;
  onDeleteChore: (choreId: string) => void;
  onToggleChoreActive: (choreId: string) => void;
  onOpenAIAssign?: () => void;
}

export const ChoreLibraryView: React.FC<ChoreLibraryViewProps> = ({
  chores,
  members,
  onOpenNewChore,
  onEditChore,
  onDeleteChore,
  onToggleChoreActive,
  onOpenAIAssign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  const categories: ChoreCategory[] = [
    'Kitchen', 'Living Room', 'Bedrooms', 'Bathrooms', 'Pets', 'Laundry', 'Yard & Outdoor', 'Daily Routine', 'General'
  ];

  const filteredChores = chores.filter((chore) => {
    if (selectedCategory !== 'all' && chore.category !== selectedCategory) {
      return false;
    }
    if (selectedAssignee !== 'all' && chore.assignedMemberId !== selectedAssignee) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = chore.title.toLowerCase().includes(q);
      const matchDesc = chore.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Master Household Chore Library
            </h2>
            <p className="text-xs text-slate-500">
              Manage chore routines, inspection quality standards, and recurring schedules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAIAssign && (
            <button
              onClick={onOpenAIAssign}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Auto-Assign Chores</span>
            </button>
          )}

          <button
            onClick={onOpenNewChore}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Chore</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chore library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-lg text-xs font-medium"
          >
            <option value="all">🏠 All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-lg text-xs font-medium"
          >
            <option value="all">👥 All Assignees</option>
            <option value="unassigned">🤝 Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatarEmoji} {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chores Grid */}
      {filteredChores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <p className="text-sm font-bold text-slate-700 mb-2">No chores found</p>
          <button
            onClick={onOpenNewChore}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Chore</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChores.map((chore) => {
            const assignee = members.find((m) => m.id === chore.assignedMemberId);
            return (
              <div
                key={chore.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {chore.category}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      ⭐ {chore.defaultPoints} pts
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                    {chore.title}
                  </h3>

                  {chore.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {chore.description}
                    </p>
                  )}

                  {/* Schedule Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Schedule:</span>
                      <span className="font-semibold capitalize">
                        {chore.frequency.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Time:</span>
                      <span className="font-semibold">
                        {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Helper:</span>
                      <span className="font-semibold flex items-center gap-1">
                        {assignee ? (
                          <>
                            <span>{assignee.avatarEmoji}</span>
                            <span>{assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Quality Checklist teaser */}
                  {chore.qualityChecklist.length > 0 && (
                    <div className="text-[11px] text-slate-500 mb-3">
                      <span className="font-semibold text-slate-700 block mb-1">
                        Inspection Criteria ({chore.qualityChecklist.length} steps):
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {chore.qualityChecklist.slice(0, 2).map((item, i) => (
                          <li key={i} className="line-clamp-1">{item}</li>
                        ))}
                        {chore.qualityChecklist.length > 2 && (
                          <li className="text-slate-400 italic">
                            +{chore.qualityChecklist.length - 2} more steps
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onToggleChoreActive(chore.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      chore.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {chore.isActive ? 'Active' : 'Paused'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditChore(chore)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit Chore"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${chore.title}" from library?`)) {
                          onDeleteChore(chore.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Chore"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
