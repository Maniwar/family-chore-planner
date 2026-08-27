import React, { useState } from 'react';
import { 
  Printer, 
  BarChart3, 
  Star, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Calendar, 
  User, 
  Share2, 
  Download,
  Flame,
  Clock,
  Home,
  Check,
  FileText,
  Sliders,
  Eye,
  ExternalLink
} from 'lucide-react';
import { HouseholdMember, Chore, ChoreAssignmentLog, HouseholdInfo } from '../types';
import { formatDisplayDate, formatTimeDisplay, getWeekDates, getTodayDateString, isChoreScheduledForDate } from '../utils/storage';
import { WeeklyWorkloadChart } from './WeeklyWorkloadChart';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { executePrint, downloadPrintableFile } from '../utils/printUtility';

interface ReportsAndPrintViewProps {
  members: HouseholdMember[];
  chores: Chore[];
  logs: ChoreAssignmentLog[];
  householdInfo: HouseholdInfo;
  currentDateStr: string;
}

export const ReportsAndPrintView: React.FC<ReportsAndPrintViewProps> = ({
  members,
  chores,
  logs,
  householdInfo,
  currentDateStr,
}) => {
  const [printFormat, setPrintFormat] = useState<'weekly_fridge' | 'daily_checklist' | 'kid_punchcard' | 'inspection_rubric'>('weekly_fridge');
  const [printMemberId, setPrintMemberId] = useState<string>('all');
  const [includeCompletedCheckmarks, setIncludeCompletedCheckmarks] = useState<boolean>(false);
  const [includeQualityNotes, setIncludeQualityNotes] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const weekDays = getWeekDates(currentDateStr);
  const todayStr = getTodayDateString();

  const handlePrint = () => {
    soundFX.playPop();
    const docTitle = `${householdInfo.familyName || 'Family'}-${printFormat}`;
    const success = executePrint('printable-fridge-schedule', docTitle);
    if (success) {
      setPrintNotice('Print dialog launched! Select "Save as PDF" or your printer.');
    } else {
      setPrintNotice('If the print dialog was blocked by your browser, click "Download Standalone HTML" below to open and print directly.');
    }
    setTimeout(() => setPrintNotice(null), 6000);
  };

  const handleDownload = () => {
    soundFX.playRewardCoin();
    const docTitle = `${householdInfo.familyName || 'Family'} Chore Schedule (${printFormat})`;
    const fileName = `${(householdInfo.familyName || 'Family').replace(/\s+/g, '-')}-${printFormat}.html`;
    downloadPrintableFile('printable-fridge-schedule', fileName, docTitle);
    setPrintNotice(`Downloaded "${fileName}"! Open it in any browser and press Print (Ctrl+P / Cmd+P) to save as PDF or print.`);
    setTimeout(() => setPrintNotice(null), 6000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Compute analytics
  const completedLogs = logs.filter(l => l.status === 'approved');
  
  const memberStats = members.map(member => {
    const memberLogs = completedLogs.filter(l => l.memberId === member.id);
    const totalPointsAwarded = memberLogs.reduce((sum, l) => sum + (l.pointsAwarded || 0) + (l.bonusPoints || 0), 0);
    const scoredLogs = memberLogs.filter(l => l.qualityScore !== undefined);
    const avgScore = scoredLogs.length > 0
      ? (scoredLogs.reduce((sum, l) => sum + (l.qualityScore || 5), 0) / scoredLogs.length).toFixed(1)
      : '5.0';

    const assignedCount = chores.filter(c => c.assignedMemberId === member.id && c.isActive).length;

    return {
      member,
      completedCount: memberLogs.length,
      totalPointsAwarded,
      avgScore,
      assignedCount,
    };
  });

  const printTargetMembers = printMemberId === 'all'
    ? members.filter(m => m.role !== 'parent' || chores.some(c => c.assignedMemberId === m.id))
    : members.filter(m => m.id === printMemberId);

  const printableChores = chores.filter(c => printMemberId === 'all' || c.assignedMemberId === printMemberId);

  // Template options list with clear descriptions
  const PRINTABLE_TEMPLATES = [
    {
      id: 'weekly_fridge' as const,
      name: '📅 Weekly 7-Day Fridge Matrix',
      badge: 'Most Popular',
      desc: 'High-density grid with Mon–Sun daily checkboxes for refrigerator magnet mounting.',
      idealFor: 'Weekly family routine tracking and habit building',
    },
    {
      id: 'daily_checklist' as const,
      name: '📋 Daily Chore Sheet with Quality Steps',
      badge: 'Detail Heavy',
      desc: 'Step-by-step cleaning checklist for each task with Mom quality verification boxes.',
      idealFor: 'Saturday deep cleaning and specific step verification',
    },
    {
      id: 'kid_punchcard' as const,
      name: '🌟 Kid Star & Reward Punchcard',
      badge: 'Kids & Teens',
      desc: 'Individual card with 20 numbered star stamp circles and personal point goals.',
      idealFor: 'Allowance tracking and motivating younger children',
    },
    {
      id: 'inspection_rubric' as const,
      name: '🔍 Household Cleanliness Standard Guide',
      badge: 'Master Guide',
      desc: 'Official household quality inspection rubric with grading criteria from A+ to Redo.',
      idealFor: 'Hanging on clipboard or fridge as standard reference',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Screen-Only Control Dashboard */}
      <div className="no-print space-y-6">
        
        {/* Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
              📊
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Household Quality Reports & Printable Fridge Hub
              </h2>
              <p className="text-xs text-slate-500">
                Track helper quality ratings and generate formatted schedules for your refrigerator
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Share App'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all active:scale-[0.98]"
              title="Download Standalone HTML Chart file for offline viewing or printing"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Save / Download HTML</span>
            </button>

            <button
              id="btn-trigger-print"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Print Feedback / Toast Notice */}
        {printNotice && (
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-base">🖨️</span>
              <span>{printNotice}</span>
            </div>
            <button
              onClick={() => setPrintNotice(null)}
              className="text-xs text-indigo-500 hover:text-indigo-800 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Chores Inspected & Done
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {completedLogs.length} Completed
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quality inspected and verified by Mom
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Family Points Earned
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900">
              {completedLogs.reduce((sum, l) => sum + (l.pointsAwarded || 0) + (l.bonusPoints || 0), 0)} pts
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Includes quality effort bonuses
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Family Quality Grade
              </span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              4.8 / 5.0 ⭐
            </div>
            <p className="text-xs text-slate-500 mt-1">
              High attention to detail across the house
            </p>
          </div>
        </div>

        {/* 7-Day Workload Distribution & Balancing Chart */}
        <WeeklyWorkloadChart
          chores={chores}
          members={members}
          centerDateStr={currentDateStr}
          showInsights={true}
        />

        {/* Member Quality Scorecard Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Family Member Quality Scorecard</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberStats.map(({ member, completedCount, totalPointsAwarded, avgScore, assignedCount }) => (
              <div key={member.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    photoUrl={member.avatarPhotoUrl}
                    emoji={member.avatarEmoji}
                    name={member.name}
                    size="md"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                    <p className="text-xs text-slate-500">{assignedCount} regular routines</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{avgScore} Avg</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    {completedCount} approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE CATALOG SELECTOR: CLEAR & INTUITIVE SELECTION */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-bold">
                  What Would You Like to Print?
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Choose a printable format below. Live preview updates immediately below so you can inspect before sending to your home printer or PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all active:scale-95"
                title="Download HTML file"
              >
                <Download className="w-4 h-4" />
                <span>Download Standalone HTML</span>
              </button>
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print This Chart Now (PDF)</span>
              </button>
            </div>
          </div>

          {/* 4 Interactive Visual Template Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRINTABLE_TEMPLATES.map((tmpl) => {
              const isSelected = printFormat === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setPrintFormat(tmpl.id);
                  }}
                  className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500 ring-2 ring-rose-500/50 shadow-md scale-[1.02]'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-700 text-rose-300">
                        {tmpl.badge}
                      </span>
                      {isSelected && <span className="text-xs font-bold text-rose-400">✓ Selected</span>}
                    </div>
                    <div className="text-sm font-bold text-white leading-snug">
                      {tmpl.name}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {tmpl.desc}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 flex items-center gap-1">
                    <span className="font-semibold text-slate-300">Best for:</span> {tmpl.idealFor}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filtering & Options Ribbon */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Filter by Member */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">Helper Filter:</span>
              <select
                value={printMemberId}
                onChange={(e) => {
                  soundFX.playPop();
                  setPrintMemberId(e.target.value);
                }}
                className="text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:ring-rose-500"
              >
                <option value="all">👨‍👩‍👧‍👦 Whole Family (All {printableChores.length} Chores)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.avatarEmoji} {m.name} ({chores.filter(c => c.assignedMemberId === m.id).length} chores)
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={includeCompletedCheckmarks}
                  onChange={(e) => setIncludeCompletedCheckmarks(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500"
                />
                <span>Show existing week checkmarks</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={includeQualityNotes}
                  onChange={(e) => setIncludeQualityNotes(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500"
                />
                <span>Include quality sign-off stamp line</span>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE PREVIEW & PHYSICAL PRINT CONTAINER */}
      {/* ========================================================================= */}
      <div id="printable-fridge-schedule" className="bg-white rounded-3xl border border-slate-300 p-6 sm:p-8 shadow-xs print-page">
        
        {/* Printable Header with House Name, Motto, and Photo if present */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {householdInfo.housePhotoUrl ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-300 shadow-2xs shrink-0">
                <img
                  src={householdInfo.housePhotoUrl}
                  alt={householdInfo.familyName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-2xl shrink-0">
                🏡
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Household Management & Quality Schedule
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {householdInfo.familyName || 'Family Household Chore Chart'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Week of {weekDays[0].dayName}, {weekDays[0].dateStr} — {weekDays[6].dayName}, {weekDays[6].dateStr} {householdInfo.houseAddressOrMotto ? `• "${householdInfo.houseAddressOrMotto}"` : ''}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-300 text-xs font-bold text-slate-800">
              📌 {PRINTABLE_TEMPLATES.find(t => t.id === printFormat)?.name.replace(/^[^\s]+\s/, '')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Mom's Quality Standard: 100% Inspected
            </p>
          </div>
        </div>

        {/* 1. WEEKLY FRIDGE MATRIX FORMAT */}
        {printFormat === 'weekly_fridge' && (
          <div className="space-y-6 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="p-2.5 border-r border-slate-400 text-left w-1/3 font-bold text-slate-900">
                    Chore & Assigned Helper
                  </th>
                  <th className="p-2.5 border-r border-slate-400 text-center w-16 font-bold text-slate-900">
                    Points
                  </th>
                  {weekDays.map(d => (
                    <th key={d.dateStr} className="p-2 border-r border-slate-400 text-center font-bold text-slate-900">
                      <div>{d.dayName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{d.dayNumber}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {printableChores.map((chore) => {
                  const assignee = members.find(m => m.id === chore.assignedMemberId);
                  return (
                    <tr key={chore.id} className="hover:bg-slate-50">
                      <td className="p-2.5 border-r border-slate-300">
                        <div className="font-bold text-slate-900 leading-snug">{chore.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">{assignee ? `${assignee.name}` : 'Unassigned'}</span>
                          <span>•</span>
                          <span>{formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}</span>
                          <span>•</span>
                          <span>{chore.category}</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-800">
                        ⭐{chore.defaultPoints}
                      </td>
                      {weekDays.map(d => {
                        const isScheduled = isChoreScheduledForDate(chore, d.dateStr);
                        const isDone = includeCompletedCheckmarks && logs.some(l => l.choreId === chore.id && l.date === d.dateStr && l.status === 'approved');
                        return (
                          <td key={d.dateStr} className="p-2 border-r border-slate-300 text-center align-middle">
                            {isScheduled ? (
                              <div className="w-5 h-5 border-2 border-slate-400 rounded-md mx-auto flex items-center justify-center font-bold text-xs">
                                {isDone ? '✓' : ''}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. DAILY DETAILED CHECKLIST FORMAT */}
        {printFormat === 'daily_checklist' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {printableChores.map((chore) => {
                const assignee = members.find(m => m.id === chore.assignedMemberId);
                return (
                  <div key={chore.id} className="p-4 border border-slate-300 rounded-2xl space-y-2.5 print-card">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{chore.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {assignee?.name} • {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)} ({chore.category})
                        </p>
                      </div>
                      <span className="font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {chore.defaultPoints} pts
                      </span>
                    </div>

                    {chore.qualityChecklist.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Quality Cleaning Checklist:</span>
                        {chore.qualityChecklist.map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-700">
                            <span className="w-4 h-4 border border-slate-400 rounded-sm shrink-0 inline-block" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Helper Completed: [ ]</span>
                      <span>Mom Inspection: [ ⭐ ⭐ ⭐ ⭐ ⭐ ]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. KID STAR & POINTS PUNCHCARD FORMAT */}
        {printFormat === 'kid_punchcard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {printTargetMembers.map(member => {
              const assigned = chores.filter(c => c.assignedMemberId === member.id);
              return (
                <div key={member.id} className="border-2 border-slate-400 rounded-3xl p-5 space-y-4 print-card">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        photoUrl={member.avatarPhotoUrl}
                        emoji={member.avatarEmoji}
                        name={member.name}
                        size="md"
                      />
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{member.name}'s Chore Punchcard</h3>
                        <p className="text-xs text-slate-500">Weekly Goal: {member.targetWeeklyPoints} points</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800">
                      ⭐ 20 Star Goals
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 block">Assigned Tasks:</span>
                    {assigned.slice(0, 6).map(c => (
                      <div key={c.id} className="flex items-center justify-between border-b border-dotted pb-1">
                        <span>{c.title}</span>
                        <span className="font-bold">⭐ {c.defaultPoints} pts</span>
                      </div>
                    ))}
                  </div>

                  {/* Punchcard 20 boxes */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-600 block mb-2">Completion Star Stamps:</span>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="h-10 border-2 border-dashed border-slate-400 rounded-xl flex items-center justify-center text-slate-300 font-bold text-xs">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. HOUSEHOLD QUALITY RUBRIC FORMAT */}
        {printFormat === 'inspection_rubric' && (
          <div className="space-y-4 text-xs">
            <div className="border border-slate-300 rounded-2xl overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900">
                  <tr>
                    <th className="p-3 border-r border-slate-300 w-24">Grade</th>
                    <th className="p-3 border-r border-slate-300 w-32">Rating</th>
                    <th className="p-3 border-r border-slate-300">Cleanliness Standard Expected</th>
                    <th className="p-3 w-28 text-center">Reward Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-black text-base text-emerald-700 border-r border-slate-200">A+</td>
                    <td className="p-3 font-bold border-r border-slate-200">⭐⭐⭐⭐⭐ (5 Stars)</td>
                    <td className="p-3 border-r border-slate-200">
                      <strong>Spotless Perfection:</strong> 100% of checklist steps completed. Corners, edges, and surfaces wiped down cleanly with no crumbs or missed areas.
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700">+5 Bonus Pts</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-base text-blue-700 border-r border-slate-200">A</td>
                    <td className="p-3 font-bold border-r border-slate-200">⭐⭐⭐⭐ (4 Stars)</td>
                    <td className="p-3 border-r border-slate-200">
                      <strong>Great Job:</strong> Neat, tidy, and finished on time. Minor negligible spot noticed but overall very high quality.
                    </td>
                    <td className="p-3 text-center font-bold text-blue-700">+2 Bonus Pts</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-base text-slate-700 border-r border-slate-200">B</td>
                    <td className="p-3 font-bold border-r border-slate-200">⭐⭐⭐ (3 Stars)</td>
                    <td className="p-3 border-r border-slate-200">
                      <strong>Good Effort:</strong> General area is cleaned. Met standard minimum requirements.
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">Standard Pts</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-base text-rose-700 border-r border-slate-200">Redo</td>
                    <td className="p-3 font-bold border-r border-slate-200">⭐ (1 Star)</td>
                    <td className="p-3 border-r border-slate-200">
                      <strong>Incomplete:</strong> Significant checklist items skipped or rushed. Helper asked to complete remaining steps before approval.
                    </td>
                    <td className="p-3 text-center font-bold text-rose-600">Pending Redo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Printable Footer with Mom's Signature & Date */}
        {includeQualityNotes && (
          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-6">
              <div>
                <span className="font-bold">Mom / Household Manager Signature:</span>
                <div className="w-48 border-b border-slate-400 mt-4" />
              </div>
              <div>
                <span className="font-bold">Date Inspected:</span>
                <div className="w-24 border-b border-slate-400 mt-4" />
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              Printed from {householdInfo.familyName || 'Family Chore Hub'} • Keep up the great work!
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
