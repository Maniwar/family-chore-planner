import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Users, 
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  Feather
} from 'lucide-react';
import { Chore, HouseholdMember } from '../types';
import { getWeekDates, isChoreScheduledForDate, getChoreAssigneeForDate } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { ThemePreset, isGlassTheme } from '../utils/theme';

interface WeeklyWorkloadChartProps {
  chores: Chore[];
  members: HouseholdMember[];
  centerDateStr: string;
  onSelectDate?: (dateStr: string) => void;
  showInsights?: boolean;
  currentTheme?: ThemePreset;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Yard & Outdoor': '#10b981', // emerald
  'Kitchen': '#f59e0b',        // amber
  'Bedrooms': '#6366f1',       // indigo
  'Bathrooms': '#06b6d4',      // cyan
  'Living Room': '#ec4899',    // pink
  'Laundry': '#8b5cf6',        // purple
  'Pets': '#3b82f6',           // blue
  'Other': '#64748b',          // slate
};

const MEMBER_COLORS: string[] = [
  '#2563eb', // blue
  '#e11d48', // rose
  '#9333ea', // purple
  '#4f46e5', // indigo
  '#d97706', // amber
  '#059669', // emerald
  '#0891b2', // cyan
  '#be185d', // pink
];

export const WeeklyWorkloadChart: React.FC<WeeklyWorkloadChartProps> = ({
  chores,
  members,
  centerDateStr,
  onSelectDate,
  showInsights = true,
  currentTheme = 'rose',
}) => {
  const isGlass = isGlassTheme(currentTheme);

  const [metricMode, setMetricMode] = useState<'count' | 'minutes'>('count');
  const [breakdownMode, setBreakdownMode] = useState<'total' | 'member' | 'category'>('total');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const weekDays = useMemo(() => getWeekDates(centerDateStr), [centerDateStr]);

  // Compute 7-day workload distribution
  const chartData = useMemo(() => {
    return weekDays.map((day) => {
      const scheduledChores = chores.filter(c => isChoreScheduledForDate(c, day.dateStr));
      const totalCount = scheduledChores.length;
      const totalMinutes = scheduledChores.reduce((sum, c) => sum + (c.estimatedMinutes || 15), 0);

      // Breakdown by member
      const memberBreakdown: Record<string, number> = {};
      members.forEach((m) => {
        const memberChores = scheduledChores.filter(c => getChoreAssigneeForDate(c, day.dateStr) === m.id);
        memberBreakdown[`mem_${m.id}`] = metricMode === 'count'
          ? memberChores.length
          : memberChores.reduce((sum, c) => sum + (c.estimatedMinutes || 15), 0);
      });

      // Breakdown by category
      const categoryBreakdown: Record<string, number> = {};
      const categories = ['Yard & Outdoor', 'Kitchen', 'Bedrooms', 'Bathrooms', 'Living Room', 'Laundry'];
      categories.forEach((cat) => {
        const catChores = scheduledChores.filter(c => c.category === cat);
        categoryBreakdown[`cat_${cat}`] = metricMode === 'count'
          ? catChores.length
          : catChores.reduce((sum, c) => sum + (c.estimatedMinutes || 15), 0);
      });

      return {
        dateStr: day.dateStr,
        dayName: day.dayName,
        dayNumber: day.dayNumber,
        isToday: day.isToday,
        totalCount,
        totalMinutes,
        value: metricMode === 'count' ? totalCount : totalMinutes,
        ...memberBreakdown,
        ...categoryBreakdown,
      };
    });
  }, [weekDays, chores, members, metricMode]);

  // Aggregate stats
  const totalWeeklyCount = chartData.reduce((sum, d) => sum + d.totalCount, 0);
  const totalWeeklyMinutes = chartData.reduce((sum, d) => sum + d.totalMinutes, 0);
  const avgDailyCount = totalWeeklyCount > 0 ? (totalWeeklyCount / 7).toFixed(1) : '0';
  const avgDailyMinutes = totalWeeklyMinutes > 0 ? Math.round(totalWeeklyMinutes / 7) : 0;

  // Find Peak and Lightest day
  const sortedByValue = [...chartData].sort((a, b) => b.value - a.value);
  const peakDay = sortedByValue[0] || chartData[0];
  const lightDay = sortedByValue[sortedByValue.length - 1] || chartData[0];

  // Workload Balance Score calculation
  const balanceScore = useMemo(() => {
    if (totalWeeklyCount === 0) return 100;
    const avg = totalWeeklyCount / 7;
    const variance = chartData.reduce((sum, d) => sum + Math.pow(d.totalCount - avg, 2), 0) / 7;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? (stdDev / avg) : 0;
    return Math.max(20, Math.min(100, Math.round(100 - cv * 65)));
  }, [chartData, totalWeeklyCount]);

  // Weekend vs Weekday analysis
  const weekendDays = chartData.filter(d => d.dayName === 'Sat' || d.dayName === 'Sun');
  const weekendTotal = weekendDays.reduce((sum, d) => sum + d.totalCount, 0);
  const weekendPercentage = totalWeeklyCount > 0 ? Math.round((weekendTotal / totalWeeklyCount) * 100) : 0;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className={`${isGlass ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200/90'} rounded-3xl border shadow-xs overflow-hidden transition-all`}>
      {/* Card Header with Unified Action Row */}
      <div className={`p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${isGlass ? '' : 'bg-gradient-to-b from-slate-50/70 to-white'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-black tracking-tight leading-tight ${isGlass ? 'text-slate-900 dark:text-white' : 'text-slate-900'}`}>
                Workload Distribution
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                balanceScore >= 80 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : balanceScore >= 60 
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${balanceScore >= 80 ? 'bg-emerald-500' : balanceScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span>{balanceScore}% Balanced</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify chore spikes and balance tasks across all 7 days
            </p>
          </div>
        </div>

        {/* Clean Segmented Controls */}
        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-between md:justify-end">
          {/* Metric Toggle: Count vs Time */}
          <div className={`inline-flex rounded-xl p-1 text-xs border ${isGlass ? 'bg-white/20 border-white/40' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => {
                soundFX.playPop();
                setMetricMode('count');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer min-h-[28px] ${
                metricMode === 'count'
                  ? (isGlass ? 'bg-white/40 dark:bg-slate-800/60 text-slate-900 dark:text-white shadow-xs' : 'bg-white text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Count
            </button>
            <button
              onClick={() => {
                soundFX.playPop();
                setMetricMode('minutes');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[28px] ${
                metricMode === 'minutes'
                  ? (isGlass ? 'bg-white/40 dark:bg-slate-800/60 text-slate-900 dark:text-white shadow-xs' : 'bg-white text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Time</span>
            </button>
          </div>

          {/* Breakdown Mode */}
          <div className={`inline-flex rounded-xl p-1 text-xs border ${isGlass ? 'bg-white/20 border-white/40' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => {
                soundFX.playPop();
                setBreakdownMode('total');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer min-h-[28px] ${
                breakdownMode === 'total'
                  ? (isGlass ? 'bg-white/40 dark:bg-slate-800/60 text-slate-900 dark:text-white shadow-xs' : 'bg-white text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                soundFX.playPop();
                setBreakdownMode('member');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[28px] ${
                breakdownMode === 'member'
                  ? (isGlass ? 'bg-white/40 dark:bg-slate-800/60 text-slate-900 dark:text-white shadow-xs' : 'bg-white text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3 h-3 text-indigo-600" />
              <span>Helper</span>
            </button>
            <button
              onClick={() => {
                soundFX.playPop();
                setBreakdownMode('category');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer min-h-[28px] ${
                breakdownMode === 'category'
                  ? (isGlass ? 'bg-white/40 dark:bg-slate-800/60 text-slate-900 dark:text-white shadow-xs' : 'bg-white text-slate-900 dark:text-white shadow-xs')
                  : 'text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 text-emerald-600" />
              <span>Room</span>
            </button>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => {
              soundFX.playPop();
              setIsExpanded(!isExpanded);
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs ${isGlass ? 'bg-white/20 border-white/40 text-slate-900 dark:text-white hover:bg-white/30' : 'border-slate-200 bg-white text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            title={isExpanded ? 'Collapse Chart' : 'Expand Chart'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Apple Stat Grid (Clean typography, no overflow) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stat 1: Total Week Volume */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Week Volume
              </span>
              <div className="mt-1.5">
                <div className="text-xl font-black text-slate-900 leading-tight">
                  {totalWeeklyCount} <span className="text-xs font-semibold text-slate-500">chores</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                  ~{formatDuration(totalWeeklyMinutes)} total
                </span>
              </div>
            </div>

            {/* Stat 2: Daily Average */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Daily Average
              </span>
              <div className="mt-1.5">
                <div className="text-xl font-black text-slate-900 leading-tight">
                  {avgDailyCount} <span className="text-xs font-semibold text-slate-500">/ day</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                  ~{formatDuration(avgDailyMinutes)} / day
                </span>
              </div>
            </div>

            {/* Stat 3: Peak Day */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-700">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Peak Day</span>
                </span>
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-black text-rose-950 leading-tight">
                  {peakDay?.dayName || 'Sat'}
                </div>
                <span className="text-[11px] font-semibold text-rose-700 block mt-0.5">
                  {peakDay?.totalCount || 0} chores ({formatDuration(peakDay?.totalMinutes || 0)})
                </span>
              </div>
            </div>

            {/* Stat 4: Lightest Day */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="flex items-center gap-1">
                  <Feather className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Lightest Day</span>
                </span>
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-black text-emerald-950 leading-tight">
                  {lightDay?.dayName || 'Wed'}
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                  {lightDay?.totalCount || 0} chores ({formatDuration(lightDay?.totalMinutes || 0)})
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Visual Bar Chart */}
          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0 && onSelectDate) {
                    const data = e.activePayload[0].payload;
                    if (data && data.dateStr) {
                      soundFX.playPop();
                      onSelectDate(data.dateStr);
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="dayName" 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={({ x, y, payload }) => {
                    const item = chartData.find(d => d.dayName === payload.value);
                    const isToday = item?.isToday;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={14}
                          textAnchor="middle"
                          fill={isToday ? '#e11d48' : '#475569'}
                          fontSize={12}
                          fontWeight={isToday ? 800 : 600}
                        >
                          {payload.value}
                        </text>
                        {isToday && (
                          <circle cx={0} cy={20} r={2.5} fill="#e11d48" />
                        )}
                      </g>
                    );
                  }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)', opacity: 0.8 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-700/80 min-w-[180px] z-50 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 font-bold">
                            <span className="text-slate-100">{label}, {data.dateStr}</span>
                            {data.isToday && (
                              <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                TODAY
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Total Scheduled:</span>
                            <span className="font-bold text-white text-sm">{data.totalCount} chores</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Est. Duration:</span>
                            <span className="font-semibold text-amber-300">~{formatDuration(data.totalMinutes)}</span>
                          </div>

                          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 text-center">
                            Tap bar to open day in schedule
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Average Reference Line */}
                <ReferenceLine 
                  y={metricMode === 'count' ? Number(avgDailyCount) : avgDailyMinutes} 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg (${metricMode === 'count' ? avgDailyCount : avgDailyMinutes + 'm'})`,
                    fill: '#64748b',
                    fontSize: 11,
                    position: 'insideTopRight'
                  }}
                />

                {/* Single Overview Bars */}
                {breakdownMode === 'total' && (
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const isPeak = entry.dateStr === peakDay?.dateStr;
                      const isLight = entry.dateStr === lightDay?.dateStr;
                      let fill = '#6366f1'; // standard indigo
                      if (entry.isToday) fill = '#e11d48'; // rose for today
                      else if (isPeak && entry.value > Number(avgDailyCount) * 1.3) fill = '#f43f5e'; // vivid rose for heavy spike
                      else if (isLight) fill = '#10b981'; // emerald for lightest
                      return <Cell key={`cell-${index}`} fill={fill} className="cursor-pointer hover:opacity-85 transition-opacity" />;
                    })}
                  </Bar>
                )}

                {/* Stacked by Member */}
                {breakdownMode === 'member' && members.map((m, idx) => (
                  <Bar
                    key={m.id}
                    dataKey={`mem_${m.id}`}
                    name={m.name.split(' ')[0]}
                    stackId="a"
                    fill={MEMBER_COLORS[idx % MEMBER_COLORS.length]}
                    radius={idx === members.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                    className="cursor-pointer"
                  />
                ))}

                {/* Stacked by Category */}
                {breakdownMode === 'category' && Object.keys(CATEGORY_COLORS).map((cat, idx) => (
                  <Bar
                    key={cat}
                    dataKey={`cat_${cat}`}
                    name={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat] || '#64748b'}
                    radius={idx === Object.keys(CATEGORY_COLORS).length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                    className="cursor-pointer"
                  />
                ))}

                {(breakdownMode === 'member' || breakdownMode === 'category') && (
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Smart Balance Insights for Parents */}
          {showInsights && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-900 text-sm">
                    Workload Advice
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-snug">
                    {weekendPercentage >= 40 ? (
                      <span>
                        <strong>Weekend load is heavy ({weekendPercentage}% of weekly tasks).</strong> Shift recurring chores to Tuesday or Thursday to free up weekend family time.
                      </span>
                    ) : peakDay && peakDay.totalCount > Number(avgDailyCount) * 1.5 ? (
                      <span>
                        <strong>{peakDay.dayName} has a chore spike ({peakDay.totalCount} chores).</strong> Distribute multi-step tasks across {lightDay?.dayName || 'mid-week'} to balance helper effort.
                      </span>
                    ) : (
                      <span>
                        <strong>Great balance!</strong> Chores are evenly distributed throughout the 7 days without creating burnout.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {peakDay && onSelectDate && (
                <button
                  onClick={() => {
                    soundFX.playPop();
                    onSelectDate(peakDay.dateStr);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 self-end sm:self-center min-h-[36px] shadow-2xs border ${isGlass ? 'bg-white/20 border-white/40 text-slate-900 dark:text-white hover:bg-white/30' : 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 dark:text-white border-slate-200'}`}
                >
                  <span>Inspect {peakDay.dayName}</span>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
