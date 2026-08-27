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
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Layers,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Chore, HouseholdMember } from '../types';
import { getWeekDates, parseLocalDate, isChoreScheduledForDate } from '../utils/storage';

interface WeeklyWorkloadChartProps {
  chores: Chore[];
  members: HouseholdMember[];
  centerDateStr: string;
  onSelectDate?: (dateStr: string) => void;
  showInsights?: boolean;
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
  '#2563eb', // blue (Mani)
  '#e11d48', // rose (Hilda)
  '#9333ea', // purple (Ashbelle)
  '#4f46e5', // indigo (Theena)
  '#d97706', // amber (Layla)
  '#059669', // emerald (Sven)
  '#0891b2', // cyan
  '#be185d', // pink
];

export const WeeklyWorkloadChart: React.FC<WeeklyWorkloadChartProps> = ({
  chores,
  members,
  centerDateStr,
  onSelectDate,
  showInsights = true,
}) => {
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
        const memberChores = scheduledChores.filter(c => c.assignedMemberId === m.id);
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

  // Workload Balance Score calculation (Standard Deviation based fairness 0-100)
  const balanceScore = useMemo(() => {
    if (totalWeeklyCount === 0) return 100;
    const avg = totalWeeklyCount / 7;
    const variance = chartData.reduce((sum, d) => sum + Math.pow(d.totalCount - avg, 2), 0) / 7;
    const stdDev = Math.sqrt(variance);
    // Lower standard deviation relative to avg gives higher score
    const cv = avg > 0 ? (stdDev / avg) : 0; // coefficient of variation
    const score = Math.max(20, Math.min(100, Math.round(100 - cv * 65)));
    return score;
  }, [chartData, totalWeeklyCount]);

  // Weekend vs Weekday analysis
  const weekendDays = chartData.filter(d => d.dayName === 'Sat' || d.dayName === 'Sun');
  const weekdayDays = chartData.filter(d => d.dayName !== 'Sat' && d.dayName !== 'Sun');
  const weekendTotal = weekendDays.reduce((sum, d) => sum + d.totalCount, 0);
  const weekendPercentage = totalWeeklyCount > 0 ? Math.round((weekendTotal / totalWeeklyCount) * 100) : 0;

  // Distinct Categories present in chores
  const activeCategories = useMemo(() => {
    const set = new Set<string>();
    chores.forEach(c => {
      if (c.isActive) set.add(c.category);
    });
    return Array.from(set);
  }, [chores]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      
      {/* Card Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Weekly Chore Workload Distribution
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                balanceScore >= 80 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : balanceScore >= 60 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {balanceScore}% Balanced
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Visual overview to identify chore spikes and balance tasks across all 7 days
            </p>
          </div>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Metric Toggle: Count vs Time */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setMetricMode('count')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                metricMode === 'count'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chore Count
            </button>
            <button
              onClick={() => setMetricMode('minutes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                metricMode === 'minutes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Est. Time</span>
            </button>
          </div>

          {/* Breakdown Mode */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setBreakdownMode('total')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                breakdownMode === 'total'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Single overview bar"
            >
              Overview
            </button>
            <button
              onClick={() => setBreakdownMode('member')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                breakdownMode === 'member'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Stacked by family helper"
            >
              <Users className="w-3 h-3 text-indigo-500" />
              <span>By Helper</span>
            </button>
            <button
              onClick={() => setBreakdownMode('category')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                breakdownMode === 'category'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Stacked by room/category"
            >
              <Layers className="w-3 h-3 text-emerald-500" />
              <span>By Room</span>
            </button>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title={isExpanded ? 'Collapse Chart' : 'Expand Chart'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                Total Week Volume
              </div>
              <div className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1.5">
                <span>{totalWeeklyCount} chores</span>
                <span className="text-xs font-medium text-slate-500">
                  (~{Math.round(totalWeeklyMinutes / 60)}h {totalWeeklyMinutes % 60}m)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                Daily Average
              </div>
              <div className="text-lg font-extrabold text-slate-900 flex items-baseline gap-1.5">
                <span>{avgDailyCount}</span>
                <span className="text-xs font-medium text-slate-500">chores/day ({avgDailyMinutes}m)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 mb-0.5 flex items-center gap-1">
                <span>🔥 Peak Day</span>
              </div>
              <div className="text-base font-extrabold text-rose-900 truncate">
                {peakDay ? `${peakDay.dayName} (${peakDay.totalCount} chores · ${peakDay.totalMinutes}m)` : '-'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5 flex items-center gap-1">
                <span>🌿 Lightest Day</span>
              </div>
              <div className="text-base font-extrabold text-emerald-900 truncate">
                {lightDay ? `${lightDay.dayName} (${lightDay.totalCount} chores · ${lightDay.totalMinutes}m)` : '-'}
              </div>
            </div>
          </div>

          {/* The Recharts Visual Bar Chart */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0 && onSelectDate) {
                    const data = e.activePayload[0].payload;
                    if (data && data.dateStr) {
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
                          dy={12}
                          textAnchor="middle"
                          fill={isToday ? '#e11d48' : '#64748b'}
                          fontSize={12}
                          fontWeight={isToday ? 700 : 500}
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
                  cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1.5 border border-slate-700 min-w-[170px] z-50">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-bold">
                            <span className="text-slate-200">{label}, {data.dateStr}</span>
                            {data.isToday && (
                              <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
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
                            <span className="font-semibold text-amber-300">~{data.totalMinutes} mins</span>
                          </div>

                          {/* Detail breakdown in tooltip */}
                          {breakdownMode === 'member' && (
                            <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Helper Breakdown:</span>
                              {members.map((m) => {
                                const val = data[`mem_${m.id}`] || 0;
                                if (val === 0) return null;
                                return (
                                  <div key={m.id} className="flex items-center justify-between text-[11px]">
                                    <span className="flex items-center gap-1 text-slate-300">
                                      <span>{m.avatarEmoji}</span>
                                      <span>{m.name.split(' ')[0]}</span>
                                    </span>
                                    <span className="font-semibold text-slate-100">
                                      {val} {metricMode === 'count' ? 'chores' : 'm'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {breakdownMode === 'category' && (
                            <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Room Breakdown:</span>
                              {activeCategories.map((cat) => {
                                const val = data[`cat_${cat}`] || 0;
                                if (val === 0) return null;
                                return (
                                  <div key={cat} className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-300">{cat}</span>
                                    <span className="font-semibold text-slate-100">
                                      {val} {metricMode === 'count' ? 'chores' : 'm'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 text-center">
                            Click to inspect day in schedule
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
                    fill: '#94a3b8',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />

                {/* Single Overview Bars */}
                {breakdownMode === 'total' && (
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
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
                    radius={idx === members.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    className="cursor-pointer"
                  />
                ))}

                {/* Stacked by Category */}
                {breakdownMode === 'category' && activeCategories.map((cat, idx) => (
                  <Bar
                    key={cat}
                    dataKey={`cat_${cat}`}
                    name={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat] || '#64748b'}
                    radius={idx === activeCategories.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    className="cursor-pointer"
                  />
                ))}

                {(breakdownMode === 'member' || breakdownMode === 'category') && (
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Smart Balance Insights for Parents */}
          {showInsights && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">
                    Parent Workload Advice:
                  </span>
                  <p className="text-slate-600">
                    {weekendPercentage >= 40 ? (
                      <span>
                        <strong>Weekend load is heavy ({weekendPercentage}% of weekly chores).</strong> Consider shifting recurring tasks (such as dusting or bathroom towel restocking) to Tuesday or Thursday to free up family weekend time.
                      </span>
                    ) : peakDay && peakDay.totalCount > Number(avgDailyCount) * 1.5 ? (
                      <span>
                        <strong>{peakDay.dayName} has a significant spike ({peakDay.totalCount} chores).</strong> Distribute multi-step tasks across {lightDay?.dayName || 'mid-week'} to balance helper effort.
                      </span>
                    ) : (
                      <span>
                        <strong>Great balance!</strong> Chores are evenly distributed throughout the 7 days without creating burnout on any single day.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {peakDay && onSelectDate && (
                <button
                  onClick={() => onSelectDate(peakDay.dateStr)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap shrink-0 transition-colors"
                >
                  <span>Inspect Peak ({peakDay.dayName})</span>
                  <TrendingUp className="w-3 h-3 text-rose-500" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
