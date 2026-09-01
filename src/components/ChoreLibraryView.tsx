import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Users, 
  Power, 
  ChevronRight, 
  ChevronDown, 
  Wand2, 
  Layers, 
  X,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chore, ChoreCategory, HouseholdMember } from '../types';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { soundFX } from '../utils/audio';
import { formatChoreScheduleDisplay } from '../utils/storage';
import { CategoryBadge, BadgeStyle, StarPointsBadge } from './CategoryBadge';

interface ChoreLibraryViewProps {
  chores: Chore[];
  members: HouseholdMember[];
  currentTheme?: ThemePreset;
  badgeStyle?: BadgeStyle;
  onOpenCreateChore: () => void;
  onEditChore: (chore: Chore) => void;
  onDeleteChore: (choreId: string) => void;
  onToggleChoreActive: (choreId: string) => void;
  onOpenAIAssign: (initialTab?: 'assigner' | 'creator' | 'coach') => void;
}

const CATEGORIES: ChoreCategory[] = [
  'Kitchen',
  'Living Room',
  'Bedrooms',
  'Bathrooms',
  'Pets',
  'Laundry',
  'Yard & Outdoor',
  'Daily Routine',
  'General',
];

const CATEGORY_EMOJIS: Record<ChoreCategory, string> = {
  'Kitchen': '🍳',
  'Living Room': '🛋️',
  'Bedrooms': '🛏️',
  'Bathrooms': '🚿',
  'Pets': '🐾',
  'Laundry': '🧺',
  'Yard & Outdoor': '🌿',
  'Daily Routine': '☀️',
  'General': '📦',
};

const CATEGORY_COLORS: Record<ChoreCategory, { bg: string; text: string; border: string }> = {
  'Kitchen': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Living Room': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Bedrooms': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Bathrooms': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  'Pets': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Laundry': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Yard & Outdoor': { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-200' },
  'Daily Routine': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  'General': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export const ChoreLibraryView: React.FC<ChoreLibraryViewProps> = ({
  chores,
  members,
  currentTheme = 'rose',
  badgeStyle = 'pastel',
  onOpenCreateChore,
  onEditChore,
  onDeleteChore,
  onToggleChoreActive,
  onOpenAIAssign,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [expandedChecklists, setExpandedChecklists] = useState<{ [choreId: string]: boolean }>({});

  const toggleChecklist = (choreId: string) => {
    soundFX.playPop();
    setExpandedChecklists(prev => ({
      ...prev,
      [choreId]: !prev[choreId],
    }));
  };

  const activeCount = useMemo(() => chores.filter(c => c.isActive).length, [chores]);
  const pausedCount = useMemo(() => chores.length - activeCount, [chores, activeCount]);

  // Filter chores
  const filteredChores = useMemo(() => {
    return chores.filter(chore => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        chore.title.toLowerCase().includes(q) ||
        chore.description?.toLowerCase().includes(q) ||
        chore.category.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'all' || chore.category === selectedCategory;

      const matchesMember = selectedMemberFilter === 'all' 
        ? true 
        : selectedMemberFilter === 'unassigned'
          ? (chore.assignedMemberId === 'unassigned' || !chore.assignedMemberId) && (!chore.dayAssignments || Object.keys(chore.dayAssignments).length === 0)
          : (chore.assignedMemberId === selectedMemberFilter || 
             (chore.dayAssignments && Object.values(chore.dayAssignments).includes(selectedMemberFilter)));

      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? chore.isActive
          : !chore.isActive;

      return matchesSearch && matchesCategory && matchesMember && matchesStatus;
    });
  }, [chores, searchQuery, selectedCategory, selectedMemberFilter, statusFilter]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedMemberFilter !== 'all' || statusFilter !== 'all';

  const handleResetFilters = () => {
    soundFX.playPop();
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMemberFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-4 pb-28 sm:pb-12 max-w-6xl mx-auto">
      
      {/* Header & Quick Action Hub */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20 text-slate-900' : 'bg-white border-slate-200/80'} rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 shadow-xs`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Title & Stats */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${theme.primaryBg} ${theme.primaryText} flex items-center justify-center text-xl shadow-xs shrink-0`}>
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg sm:text-xl font-black tracking-tight ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900'}`}>
                  Chore Library
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {chores.length} templates
                </span>
              </div>
              <p className={`text-xs font-medium ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-500'}`}>
                Master household routines · {activeCount} active · {pausedCount} paused · {members.length} helpers
              </p>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {/* AI Chore Assigner */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundFX.playPop();
                onOpenAIAssign('assigner');
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black ${
                isGlassTheme(currentTheme) ? 'apple-glass-button text-purple-900 border-white/20' : 'bg-purple-50 text-purple-700 border border-purple-200/90 hover:bg-purple-100'
              } transition-all cursor-pointer shadow-2xs min-h-[44px]`}
            >
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>AI Assigner</span>
            </motion.button>

            {/* AI Chore Creator */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundFX.playPop();
                onOpenAIAssign('creator');
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black ${
                isGlassTheme(currentTheme) ? 'apple-glass-button text-indigo-900 border-white/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/90 hover:bg-indigo-100'
              } transition-all cursor-pointer shadow-2xs min-h-[44px]`}
            >
              <Wand2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>AI Creator</span>
            </motion.button>

            {/* Add Manual Chore Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundFX.playPop();
                onOpenCreateChore();
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black ${
                isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : `${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText}`
              } shadow-xs transition-all cursor-pointer min-h-[44px] shrink-0`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Add Chore</span>
              <span className="xs:hidden">Add</span>
            </motion.button>
          </div>

        </div>
      </motion.div>

      {/* iOS-Style Search & Filtering Inset Group */}
      <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'} rounded-2xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200/80'} p-3 sm:p-4 shadow-xs space-y-3`}>
        
        {/* Row 1: iOS UISearchBar & Helper Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          
          {/* iOS Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines, room, or inspection steps..."
              className={`w-full pl-10 pr-9 py-2 text-xs sm:text-sm font-semibold rounded-xl border ${
                isGlassTheme(currentTheme) 
                  ? 'apple-glass-input border-white/20 text-slate-900 placeholder:text-slate-500' 
                  : 'border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400'
              } transition-all min-h-[44px]`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs transition-all cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Helper Filter Dropdown */}
          <div className="sm:w-56">
            <div className="relative">
              <select
                value={selectedMemberFilter}
                onChange={(e) => {
                  soundFX.playPop();
                  setSelectedMemberFilter(e.target.value);
                }}
                className={`w-full text-xs font-bold py-2.5 pl-3 pr-8 rounded-xl border ${
                  isGlassTheme(currentTheme)
                    ? 'apple-glass-input border-white/20 text-slate-900'
                    : 'border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-rose-500/20 text-slate-700'
                } min-h-[44px] appearance-none cursor-pointer`}
              >
                <option value="all">👥 All Helpers ({chores.length})</option>
                <option value="unassigned">🤝 Unassigned Chores</option>
                {members.map(m => {
                  const count = chores.filter(c => c.assignedMemberId === m.id).length;
                  return (
                    <option key={m.id} value={m.id}>
                      {m.avatarEmoji} {m.name} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Status Filter Segmented Control & Active Count */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          
          {/* iOS Segmented Control */}
          <div className={`inline-flex ${isGlassTheme(currentTheme) ? 'bg-black/5 dark:bg-white/10' : 'bg-slate-100'} p-1 rounded-xl border ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-200/80'}`}>
            <button
              onClick={() => {
                soundFX.playPop();
                setStatusFilter('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[32px] ${
                statusFilter === 'all'
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill text-slate-900 shadow-xs'
                    : 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({chores.length})
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                setStatusFilter('active');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill text-emerald-900 shadow-xs'
                    : 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Active ({activeCount})</span>
            </button>

            <button
              onClick={() => {
                soundFX.playPop();
                setStatusFilter('paused');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
                statusFilter === 'paused'
                  ? isGlassTheme(currentTheme)
                    ? 'apple-glass-pill text-slate-900 shadow-xs'
                    : 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Paused ({pausedCount})</span>
            </button>
          </div>

          {/* Reset Filters Chip if active */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer min-h-[32px]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Row 3: Room Category Filter Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 -mx-1 px-1">
          <button
            onClick={() => {
              soundFX.playPop();
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[36px] cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'all'
                ? isGlassTheme(currentTheme)
                  ? 'apple-glass-button-primary shadow-2xs'
                  : `${theme.primaryBg} ${theme.primaryText} shadow-2xs`
                : isGlassTheme(currentTheme)
                ? 'apple-glass-pill text-slate-800'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <span>All Rooms</span>
            <span className="text-[10px] opacity-85 bg-black/10 px-1.5 py-0.2 rounded-full font-black">
              {chores.length}
            </span>
          </button>

          {CATEGORIES.map(cat => {
            const count = chores.filter(c => c.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            const emoji = CATEGORY_EMOJIS[cat] || '📦';
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => {
                  soundFX.playPop();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[36px] cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? isGlassTheme(currentTheme)
                      ? 'apple-glass-button-primary shadow-2xs'
                      : `${theme.primaryBg} ${theme.primaryText} shadow-2xs`
                    : isGlassTheme(currentTheme)
                    ? 'apple-glass-pill text-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{emoji}</span>
                <span>{cat}</span>
                <span className="text-[10px] opacity-85 bg-black/10 px-1.5 py-0.2 rounded-full font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Results Header when filtered */}
      {hasActiveFilters && (
        <div className={`flex items-center justify-between text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border shadow-xs ${isGlassTheme(currentTheme) ? 'apple-glass-panel border-white/40 text-slate-700' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
          <span>Showing {filteredChores.length} of {chores.length} chore templates</span>
          {filteredChores.length !== chores.length && (
            <button
              onClick={handleResetFilters}
              className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-black"
            >
              Show all ({chores.length})
            </button>
          )}
        </div>
      )}

      {/* Chores Grid / Inset Cards */}
      {filteredChores.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4 shadow-xs"
        >
          <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
            ✨
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              No matching chore templates
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {hasActiveFilters
                ? 'Try resetting your search or room category filters to see more chores.'
                : 'Your household library is clean! Create a chore template manually or generate age-appropriate routines with Gemini AI.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-2xs transition-all cursor-pointer min-h-[44px]"
              >
                <X className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAIAssign('creator')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>Generate Chores with AI</span>
                </button>
                <button
                  onClick={onOpenCreateChore}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} shadow-sm active:scale-95 transition-all cursor-pointer min-h-[44px]`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create Custom Chore</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredChores.map((chore) => {
              const member = members.find(m => m.id === chore.assignedMemberId);
              const isExpanded = expandedChecklists[chore.id] || false;
              const categoryEmoji = CATEGORY_EMOJIS[chore.category] || '📦';
              const catColor = CATEGORY_COLORS[chore.category] || CATEGORY_COLORS['General'];

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={chore.id}
                  className={`${
                    isGlassTheme(currentTheme) ? 'apple-glass-card' : 'bg-white'
                  } rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden group ${
                    isGlassTheme(currentTheme)
                      ? chore.isActive ? 'border-white/20' : 'border-white/40 opacity-70'
                      : chore.isActive
                      ? 'border-slate-200/90 hover:border-slate-300'
                      : 'border-slate-200/60 opacity-65 bg-slate-50/50'
                  }`}
                >
                  {/* Top Section */}
                  <div className="p-3.5 sm:p-4 space-y-2.5">
                    
                    {/* Category Pill & iOS Active Status Switch */}
                    <div className="flex items-center justify-between gap-2">
                      <CategoryBadge category={chore.category} size="sm" style={badgeStyle} />

                      {/* iOS Native Toggle Switch */}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${isGlassTheme(currentTheme) ? 'text-white/70' : 'text-slate-400'}`}>
                          {chore.isActive ? 'Active' : 'Paused'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop();
                            onToggleChoreActive(chore.id);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer min-h-[30px] min-w-[40px] p-0.5 ${
                            isGlassTheme(currentTheme) 
                              ? chore.isActive 
                                ? 'bg-emerald-500/30 border border-emerald-300/50 backdrop-blur-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]' 
                                : 'bg-white/10 border border-white/20'
                              : chore.isActive 
                                ? 'bg-emerald-500' 
                                : 'bg-slate-300'
                          }`}
                          role="switch"
                          aria-checked={chore.isActive}
                          title={chore.isActive ? 'Pause this routine' : 'Activate this routine'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                              chore.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug tracking-tight">
                        {chore.title}
                      </h3>
                      {chore.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {chore.description}
                        </p>
                      )}
                    </div>

                    {/* Badges: Assigned Helper, Points, Est Time, Frequency */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {/* Helper Chip */}
                      {(() => {
                        const hasMultiDay = chore.dayAssignments && Object.keys(chore.dayAssignments).length > 0;
                        const uniqueIds = hasMultiDay 
                          ? Array.from(new Set(Object.values(chore.dayAssignments!))).filter(id => id && id !== 'off' && id !== 'unassigned')
                          : [];
                        const assignedList = uniqueIds
                          .map(id => members.find(m => m.id === id))
                          .filter(Boolean) as HouseholdMember[];

                        if (assignedList.length > 1) {
                          return (
                            <div 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200/80 text-[11px] font-bold"
                              title="Rotating helper schedule"
                            >
                              <div className="flex -space-x-1">
                                {assignedList.slice(0, 3).map(m => (
                                  <span key={m.id} className="text-xs">{m.avatarEmoji}</span>
                                ))}
                              </div>
                              <span className="truncate max-w-[130px]">
                                {assignedList.map(m => m.name.split(' ')[0]).join(' & ')}
                              </span>
                            </div>
                          );
                        }

                        if (assignedList.length === 1) {
                          return (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                              <span>{assignedList[0].avatarEmoji}</span>
                              <span className="truncate max-w-[100px]">{assignedList[0].name}</span>
                            </div>
                          );
                        }

                        return (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                            {member ? (
                              <>
                                <span>{member.avatarEmoji}</span>
                                <span className="truncate max-w-[100px]">{member.name}</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500">Unassigned</span>
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* Points Chip */}
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-black">
                        <span>⭐</span>
                        <span>{chore.defaultPoints} pts</span>
                      </div>

                      {/* Minutes Chip */}
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{chore.estimatedMinutes || 15}m</span>
                      </div>

                      {/* Schedule / Frequency */}
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span>{formatChoreScheduleDisplay(chore)}</span>
                      </div>
                    </div>

                    {/* Quality Inspection Checklist Accordion */}
                    {chore.qualityChecklist && chore.qualityChecklist.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                        <button
                          onClick={() => toggleChecklist(chore.id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer min-h-[36px]"
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Quality Checklist ({chore.qualityChecklist.length} steps)</span>
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className={`mt-1.5 p-2.5 ${
                                isGlassTheme(currentTheme) ? 'bg-white/40 border-white/20' : 'bg-slate-50/90 border-slate-200/60'
                              } rounded-xl space-y-1.5 text-xs text-slate-700 border`}>
                                {chore.qualityChecklist.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="text-[11px] leading-tight text-slate-700">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Strip */}
                  <div className={`px-3.5 py-2 ${
                    isGlassTheme(currentTheme) ? 'bg-white/30 border-white/20' : 'bg-slate-50/90 border-slate-100'
                  } border-t flex items-center justify-between gap-2`}>
                    <span className="text-[10px] font-semibold text-slate-500 truncate">
                      {chore.timeOfDay ? `Scheduled: ${chore.timeOfDay}` : 'Routine Template'}
                    </span>

                    <div className="flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          soundFX.playPop();
                          onEditChore(chore);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                          isGlassTheme(currentTheme) ? 'apple-glass-button text-slate-900 min-h-[36px]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 min-h-[40px]'
                        } transition-all cursor-pointer flex items-center gap-1.5`}
                        title="Edit Chore"
                        aria-label="Edit Chore"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          soundFX.playPop();
                          if (confirm(`Delete chore template "${chore.title}"?`)) {
                            onDeleteChore(chore.id);
                          }
                        }}
                        className={`p-2 rounded-xl ${
                          isGlassTheme(currentTheme) ? 'text-rose-600 hover:bg-rose-500/10 min-h-[36px] min-w-[36px]' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 min-h-[40px] min-w-[40px]'
                        } transition-all cursor-pointer flex items-center justify-center`}
                        title="Delete Chore"
                        aria-label="Delete Chore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
};
