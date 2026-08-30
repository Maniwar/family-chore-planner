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
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  TrendingDown,
  Activity,
  History,
  Sparkle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { isGlassTheme, ThemePreset } from '../utils/theme';
import { HouseholdMember, Chore, ChoreAssignmentLog, HouseholdInfo } from '../types';
import { formatDisplayDate, formatTimeDisplay, getWeekDates, getTodayDateString, isChoreScheduledForDate, parseLocalDate } from '../utils/storage';
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
  currentTheme?: ThemePreset;
}

export const ReportsAndPrintView: React.FC<ReportsAndPrintViewProps> = ({
  members,
  chores,
  logs,
  householdInfo,
  currentDateStr,
  currentTheme,
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
  const waivedLogs = logs.filter(l => l.penaltyWaived);
  const redoLogs = logs.filter(l => l.qualityGrade === 'Redo');
  const lateLogs = logs.filter(l => l.daysLate && l.daysLate > 0);
  
  const memberStats = members.map(member => {
    const memberLogs = completedLogs.filter(l => l.memberId === member.id);
    const memberWaived = waivedLogs.filter(l => l.memberId === member.id);
    const memberRedos = redoLogs.filter(l => l.memberId === member.id);
    const memberLate = lateLogs.filter(l => l.memberId === member.id);
    const totalPointsAwarded = memberLogs.reduce((sum, l) => sum + (l.pointsAwarded || 0) + (l.bonusPoints || 0), 0);
    const scoredLogs = memberLogs.filter(l => l.qualityScore !== undefined);
    const avgScore = scoredLogs.length > 0
      ? (scoredLogs.reduce((sum, l) => sum + (l.qualityScore || 5), 0) / scoredLogs.length).toFixed(1)
      : '5.0';

    const assignedCount = chores.filter(c => c.assignedMemberId === member.id && c.isActive).length;

    return {
      member,
      completedCount: memberLogs.length,
      waivedCount: memberWaived.length,
      redoCount: memberRedos.length,
      lateCount: memberLate.length,
      totalPointsAwarded,
      avgScore,
      assignedCount,
    };
  });

  // Calculate 7-Day Timeline for Overdue, Redos & Waived Penalties
  const timelineData = weekDays.map(dayItem => {
    const dateStr = dayItem.dateStr;
    const dayLogs = logs.filter(l => l.date === dateStr);
    const dayCompleted = dayLogs.filter(l => l.status === 'approved').length;
    const dayWaived = dayLogs.filter(l => l.penaltyWaived).length;
    const dayRedos = dayLogs.filter(l => l.qualityGrade === 'Redo').length;
    const dayLate = dayLogs.filter(l => (l.daysLate && l.daysLate > 0) || l.isMissed).length;

    const dateObj = parseLocalDate(dateStr);
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

    return {
      date: dateStr,
      dayLabel,
      completed: dayCompleted,
      waived: dayWaived,
      redos: dayRedos,
      overdue: dayLate,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-8 reports-glass-wrapper">
      
      {/* Screen-Only Control Dashboard */}
      <div className="no-print space-y-5">
        
        {/* Header Banner */}
        <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
              📊
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-black text-slate-900   leading-tight`}>
                Household Quality & Print Hub
              </h2>
              <p className={`text-xs text-slate-500   mt-0.5`}>
                Track helper quality ratings and generate formatted schedules for your refrigerator
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700   bg-slate-100 hover:bg-slate-200 transition-colors min-h-[44px] cursor-pointer active:scale-95`}
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Link Copied!' : 'Share App'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all active:scale-95 min-h-[44px] cursor-pointer shadow-2xs"
              title="Download Standalone HTML Chart file for offline viewing or printing"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Save HTML</span>
            </button>

            <button
              id="btn-trigger-print"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-95 min-h-[44px] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Print Feedback / Toast Notice */}
        {printNotice && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 font-semibold">
              <span className="text-lg">🖨️</span>
              <span>{printNotice}</span>
            </div>
            <button
              onClick={() => setPrintNotice(null)}
              className="text-xs text-indigo-500 hover:text-indigo-800 font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Analytics Summary Cards (Apple Health / Activity Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} p-4 sm:p-5 rounded-3xl border shadow-xs `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-400'}`}>
                Chores Inspected & Done
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-black text-slate-900   leading-tight`}>
                {completedLogs.length} <span className={`text-sm font-semibold text-slate-500  `}>completed</span>
              </div>
              <p className={`text-xs mt-1 ${isGlassTheme(currentTheme) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                Quality inspected & approved by Mom
              </p>
            </div>
          </div>

          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} p-4 sm:p-5 rounded-3xl border shadow-xs `}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                Total Family Points Earned
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 leading-tight">
                {completedLogs.reduce((sum, l) => sum + (l.pointsAwarded || 0) + (l.bonusPoints || 0), 0)} <span className="text-sm font-semibold text-amber-700">pts</span>
              </div>
              <p className={`text-xs mt-1 ${isGlassTheme(currentTheme) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                Includes quality effort and speed bonuses
              </p>
            </div>
          </div>

          <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} p-4 sm:p-5 rounded-3xl border shadow-xs `}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-400'}`}>
                Average Quality Grade
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-black text-slate-900   leading-tight`}>
                4.8 <span className={`text-base font-semibold text-slate-500  `}>/ 5.0 ⭐</span>
              </div>
              <p className={`text-xs mt-1 ${isGlassTheme(currentTheme) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                Consistently high attention to detail
              </p>
            </div>
          </div>
        </div>

        {/* 7-Day Workload Distribution & Balancing Chart */}
        <WeeklyWorkloadChart
          chores={chores}
          members={members}
          centerDateStr={currentDateStr}
          showInsights={true}
          currentTheme={currentTheme}
        />

        {/* Member Quality Scorecard Grid */}
        <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} rounded-3xl border p-5 shadow-xs space-y-4`}>
          <h3 className={`text-sm font-black text-slate-900   flex items-center gap-2`}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Family Member Quality Scorecard</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberStats.map(({ member, completedCount, totalPointsAwarded, avgScore, assignedCount }) => (
              <div key={member.id} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-slate-50 border-slate-200/80'}`}>
                <div className="flex items-center gap-3">
                  <Avatar
                    photoUrl={member.avatarPhotoUrl}
                    emoji={member.avatarEmoji}
                    name={member.name}
                    size="md"
                  />
                  <div>
                    <h4 className={`text-sm font-bold text-slate-900  `}>{member.name}</h4>
                    <p className={`text-xs text-slate-500  `}>{assignedCount} regular routines</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{avgScore} Avg</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                    {completedCount} approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DISCIPLINE & WAIVED PENALTY TIMELINE TRACKER (Requested by User) */}
        {/* ========================================================================= */}
        <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} rounded-3xl border p-5 sm:p-6 shadow-xs space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className={`text-base sm:text-lg font-black text-slate-900  `}>
                  Household Discipline & Waived Penalty Timeline
                </h3>
              </div>
              <p className={`text-xs mt-1 ${isGlassTheme(currentTheme) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                Track overdue tasks, redo inspections, and waived penalty grace periods across all helpers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                🛡️ {waivedLogs.length} Total Waived
              </span>
              <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                🔄 {redoLogs.length} Total Redos
              </span>
            </div>
          </div>

          {/* Recharts Timeline Graph */}
          <div className={`p-4 rounded-2xl border ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-slate-50/70 border-slate-200/70'}`}>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '16px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      padding: '10px 14px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed & Approved"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overdue"
                    name="Overdue / Late"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="redos"
                    name="Redo Needed"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f43f5e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="waived"
                    name="Penalty Waived"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Discipline & Waived Ranking Breakdown */}
          <div className="space-y-3">
            <h4 className={`text-xs font-black uppercase tracking-wider text-slate-500  `}>
              Discipline & Grace Breakdown by Family Member
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {memberStats.map(({ member, completedCount, waivedCount, redoCount, lateCount }) => (
                <div key={member.id} className={`p-4 rounded-2xl border space-y-2.5 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-slate-50 border-slate-200/80'}`}>
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      photoUrl={member.avatarPhotoUrl}
                      emoji={member.avatarEmoji}
                      name={member.name}
                      size="sm"
                    />
                    <div>
                      <h5 className={`text-xs font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900'}`}>{member.name}</h5>
                      <span className={`text-[10px] capitalize ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500'}`}>{member.role}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                    <div className={`p-2 rounded-xl border ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      <span className={`text-[10px] font-bold block ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-400'}`}>Overdue</span>
                      <span className={`text-xs font-black ${lateCount > 0 ? 'text-amber-600' : 'text-slate-700  '}`}>
                        {lateCount}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      <span className={`text-[10px] font-bold block ${isGlassTheme(currentTheme) ? 'text-slate-600' : 'text-slate-400'}`}>Redos</span>
                      <span className={`text-xs font-black ${redoCount > 0 ? 'text-rose-600' : 'text-slate-700  '}`}>
                        {redoCount}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isGlassTheme(currentTheme) ? 'bg-white/40 border-white/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      <span className="text-[10px] font-bold text-purple-600 block">Waived</span>
                      <span className="text-xs font-black text-purple-700">
                        {waivedCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE CATALOG SELECTOR: APPLE INSET GROUPED SELECTION */}
        {/* ========================================================================= */}
        <div className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'} rounded-3xl border p-5 sm:p-6 shadow-xs space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <h3 className={`text-base sm:text-lg font-black text-slate-900  `}>
                  Select Printable Template
                </h3>
              </div>
              <p className={`text-xs mt-1 ${isGlassTheme(currentTheme) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                Choose a format below. Live preview updates immediately below for easy review before sending to paper or PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Selected Template</span>
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
                  className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700  '
                  }`}
                >
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tmpl.badge}
                      </span>
                      {isSelected && <span className="text-xs font-black text-rose-600">✓ Selected</span>}
                    </div>
                    <div className={`text-sm font-black text-slate-900   leading-snug`}>
                      {tmpl.name}
                    </div>
                    <p className={`text-xs text-slate-500   leading-relaxed`}>
                      {tmpl.desc}
                    </p>
                  </div>

                  <div className={`text-[11px] text-slate-500   border-t border-slate-200/80 pt-2 flex items-center gap-1`}>
                    <span className={`font-bold text-slate-700  `}>Best for:</span> {tmpl.idealFor}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filtering & Options Ribbon */}
          <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Filter by Member */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Helper Filter:</span>
              <select
                value={printMemberId}
                onChange={(e) => {
                  soundFX.playPop();
                  setPrintMemberId(e.target.value);
                }}
                className="text-xs p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold focus:ring-rose-500 cursor-pointer min-h-[36px]"
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
              <label className={`flex items-center gap-2 cursor-pointer select-none text-slate-700   font-medium min-h-[36px]`}>
                <input
                  type="checkbox"
                  checked={includeCompletedCheckmarks}
                  onChange={(e) => setIncludeCompletedCheckmarks(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4"
                />
                <span>Show completed checkmarks in preview</span>
              </label>

              <label className={`flex items-center gap-2 cursor-pointer select-none text-slate-700   font-medium min-h-[36px]`}>
                <input
                  type="checkbox"
                  checked={includeQualityNotes}
                  onChange={(e) => setIncludeQualityNotes(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4"
                />
                <span>Include quality inspection signature line</span>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE PREVIEW & PHYSICAL PRINT CONTAINER */}
      {/* ========================================================================= */}
      <div id="printable-fridge-schedule" className={`${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/30 print-card' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800'} rounded-3xl border shadow-xs print-page`}>
        
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
              <span className={`text-[10px] font-black uppercase tracking-widest text-slate-500   block`}>
                Household Management & Quality Schedule
              </span>
              <h1 className={`text-xl sm:text-2xl font-black text-slate-900   tracking-tight leading-tight`}>
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
            <p className={`text-[11px] text-slate-500   mt-1`}>
              Mom's Quality Standard: 100% Inspected
            </p>
          </div>
        </div>

        {/* 1. WEEKLY FRIDGE MATRIX FORMAT */}
        {printFormat === 'weekly_fridge' && (
          <div className="space-y-3">
            <div className={`no-print md:hidden text-[11px] text-slate-500   italic text-center pb-1`}>
              ← Swipe horizontally to see all 7 days →
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-300">
              <table className="w-full border-collapse text-xs min-w-[620px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className={`p-3 border-r border-slate-300 text-left w-1/3 font-black text-slate-900  `}>
                      Chore & Assigned Helper
                    </th>
                    <th className={`p-3 border-r border-slate-300 text-center w-16 font-black text-slate-900  `}>
                      Pts
                    </th>
                    {weekDays.map(d => (
                      <th key={d.dateStr} className={`p-2.5 border-r border-slate-300 text-center font-black ${
                        d.isToday ? 'bg-rose-50 text-rose-900' : 'text-slate-900  '
                      }`}>
                        <div>{d.dayName}</div>
                        <div className={`text-[10px] text-slate-500   font-bold`}>{d.dayNumber}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printableChores.map((chore) => {
                    const assignee = members.find(m => m.id === chore.assignedMemberId);
                    return (
                      <tr key={chore.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 border-r border-slate-200">
                          <div className={`font-bold text-slate-900   text-xs leading-snug`}>{chore.title}</div>
                          <div className={`text-[11px] text-slate-500   flex items-center gap-1.5 mt-0.5`}>
                            <span className={`font-bold text-slate-700  `}>{assignee ? `${assignee.name}` : 'Unassigned'}</span>
                            <span>•</span>
                            <span>{formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)}</span>
                            <span>•</span>
                            <span>{chore.category}</span>
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-center font-black text-slate-800">
                          ⭐{chore.defaultPoints}
                        </td>
                        {weekDays.map(d => {
                          const isScheduled = isChoreScheduledForDate(chore, d.dateStr);
                          const isDone = includeCompletedCheckmarks && logs.some(l => l.choreId === chore.id && l.date === d.dateStr && l.status === 'approved');
                          return (
                            <td key={d.dateStr} className={`p-2.5 border-r border-slate-200 text-center align-middle ${
                              d.isToday ? 'bg-rose-50/30' : ''
                            }`}>
                              {isScheduled ? (
                                <div className={`w-6 h-6 border-2 rounded-lg mx-auto flex items-center justify-center font-black text-xs ${
                                  isDone 
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs' 
                                    : 'border-slate-400 bg-white   text-slate-700  '
                                }`}>
                                  {isDone ? '✓' : ''}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs font-semibold">—</span>
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
                        <h4 className={`font-bold text-slate-900   text-sm leading-tight`}>{chore.title}</h4>
                        <p className={`text-xs text-slate-500   mt-0.5`}>
                          {assignee?.name} • {formatTimeDisplay(chore.scheduledTime, chore.timeOfDay)} ({chore.category})
                        </p>
                      </div>
                      <span className="font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {chore.defaultPoints} pts
                      </span>
                    </div>

                    {chore.qualityChecklist.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                        <span className={`text-[10px] uppercase font-bold text-slate-500   block`}>Quality Cleaning Checklist:</span>
                        {chore.qualityChecklist.map((step, i) => (
                          <div key={i} className={`flex items-center gap-2 text-slate-700  `}>
                            <span className="w-4 h-4 border border-slate-400 rounded-sm shrink-0 inline-block" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={`pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400  `}>
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
                        <h3 className={`font-bold text-base text-slate-900  `}>{member.name}'s Chore Punchcard</h3>
                        <p className={`text-xs text-slate-500  `}>Weekly Goal: {member.targetWeeklyPoints} points</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800">
                      ⭐ 20 Star Goals
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className={`font-bold text-slate-700   block`}>Assigned Tasks:</span>
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
                <thead className={`bg-slate-100 border-b border-slate-300 font-bold text-slate-900  `}>
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
                    <td className={`p-3 font-black text-base text-slate-700   border-r border-slate-200`}>B</td>
                    <td className="p-3 font-bold border-r border-slate-200">⭐⭐⭐ (3 Stars)</td>
                    <td className="p-3 border-r border-slate-200">
                      <strong>Good Effort:</strong> General area is cleaned. Met standard minimum requirements.
                    </td>
                    <td className={`p-3 text-center font-semibold text-slate-700  `}>Standard Pts</td>
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

            <div className={`text-right text-[11px] text-slate-400  `}>
              Printed from {householdInfo.familyName || 'Family Chore Hub'} • Keep up the great work!
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
