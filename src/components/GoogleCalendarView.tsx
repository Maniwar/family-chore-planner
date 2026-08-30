import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  Send, 
  Check, 
  CalendarDays,
  Trash2,
  Bell,
  Shield,
  Layers
} from 'lucide-react';
import { 
  Chore, 
  HouseholdMember, 
  GoogleCalendarItem, 
  CalendarSyncLog 
} from '../types';
import {
  getSavedCalendarToken,
  getSavedCalendarId,
  saveSelectedCalendarId,
  clearCalendarToken,
  requestGoogleCalendarAuth,
  fetchGoogleCalendars,
  createFamilyChoreCalendar,
  syncChoreToGoogleCalendar,
  getSavedSyncLogs,
  saveSyncLogs,
} from '../utils/googleCalendar';

import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface GoogleCalendarViewProps {
  currentTheme: string;
  chores: Chore[];
  members: HouseholdMember[];
  selectedDate: string;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({
  currentTheme,
  chores,
  members,
  selectedDate,
}) => {
  const [token, setToken] = useState<string | null>(getSavedCalendarToken());
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(getSavedCalendarId());
  const [syncLogs, setSyncLogs] = useState<CalendarSyncLog[]>(getSavedSyncLogs());

  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [filterMemberId, setFilterMemberId] = useState<string>('all');

  const [selectedChoreIds, setSelectedChoreIds] = useState<{ [id: string]: boolean }>({});
  const [syncTargetDate, setSyncTargetDate] = useState<string>(selectedDate);

  const [userInfo, setUserInfo] = useState<{ displayName?: string | null; email?: string | null; photoURL?: string | null } | null>(() => {
    try {
      const raw = localStorage.getItem('family_chores_gcal_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Load calendars when token is available
  useEffect(() => {
    if (token) {
      loadCalendars(token);
    }
  }, [token]);

  // Default select all active chores on date
  useEffect(() => {
    const initial: { [id: string]: boolean } = {};
    chores.filter(c => c.isActive).forEach(c => {
      initial[c.id] = true;
    });
    setSelectedChoreIds(initial);
  }, [chores]);

  const loadCalendars = async (accessToken: string) => {
    setIsLoadingCalendars(true);
    try {
      const items = await fetchGoogleCalendars(accessToken);
      setCalendars(items);

      // If no calendar currently selected, default to primary or one with "family" in name
      const familyCal = items.find(c => c.summary.toLowerCase().includes('family') || c.summary.toLowerCase().includes('chore'));
      if (familyCal && selectedCalendarId === 'primary') {
        setSelectedCalendarId(familyCal.id);
        saveSelectedCalendarId(familyCal.id);
      }
    } catch (err: any) {
      console.error('Error loading calendars:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load Google Calendars' });
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleConnectGoogle = async () => {
    setStatusMessage(null);
    try {
      const authResult = await requestGoogleCalendarAuth();
      const newToken = authResult.accessToken;
      setToken(newToken);
      if (authResult.user) {
        setUserInfo({
          displayName: authResult.user.displayName,
          email: authResult.user.email,
          photoURL: authResult.user.photoURL,
        });
      }
      setStatusMessage({ type: 'success', text: 'Connected to Google Calendar successfully!' });
      await loadCalendars(newToken);
    } catch (err: any) {
      console.error('Google auth error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Google authentication failed. Please try again.' });
    }
  };

  const handleDisconnect = () => {
    clearCalendarToken();
    setToken(null);
    setUserInfo(null);
    setCalendars([]);
    setStatusMessage({ type: 'info', text: 'Disconnected from Google Calendar' });
  };

  const handleCalendarChange = (calId: string) => {
    setSelectedCalendarId(calId);
    saveSelectedCalendarId(calId);
  };

  const handleCreateDedicatedCalendar = async () => {
    if (!token) return;
    try {
      setIsLoadingCalendars(true);
      const newCal = await createFamilyChoreCalendar(token, '🏡 Family Chores & Tasks');
      setCalendars(prev => [newCal, ...prev]);
      setSelectedCalendarId(newCal.id);
      saveSelectedCalendarId(newCal.id);
      setStatusMessage({ type: 'success', text: `Created new Google Calendar: "${newCal.summary}"!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create dedicated calendar' });
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleSyncSelectedChores = async () => {
    if (!token) {
      await handleConnectGoogle();
      return;
    }

    const activeSelectedChores = chores.filter(c => c.isActive && selectedChoreIds[c.id]);
    if (activeSelectedChores.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chore to sync.' });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);
    setSyncProgress({ current: 0, total: activeSelectedChores.length });

    const newLogs: CalendarSyncLog[] = [];
    let successCount = 0;

    for (let i = 0; i < activeSelectedChores.length; i++) {
      const chore = activeSelectedChores[i];
      const member = members.find(m => m.id === chore.assignedMemberId) || null;

      try {
        const result = await syncChoreToGoogleCalendar(
          token,
          selectedCalendarId,
          chore,
          member,
          syncTargetDate
        );

        newLogs.push({
          id: `log-${Date.now()}-${chore.id}`,
          choreId: chore.id,
          choreTitle: chore.title,
          memberName: member ? member.name : 'Unassigned',
          date: syncTargetDate,
          googleEventId: result.eventId,
          htmlLink: result.htmlLink,
          syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        successCount++;
      } catch (err: any) {
        console.error(`Failed to sync chore ${chore.title}:`, err);
      }

      setSyncProgress({ current: i + 1, total: activeSelectedChores.length });
    }

    const updatedLogs = [...newLogs, ...syncLogs].slice(0, 50);
    setSyncLogs(updatedLogs);
    saveSyncLogs(updatedLogs);

    setIsSyncing(false);
    setSyncProgress(null);
    setStatusMessage({
      type: 'success',
      text: `Successfully synced ${successCount} chore events to your Google Calendar for ${syncTargetDate}!`,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20 text-slate-900' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white'}`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Google Workspace Integration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Google Family Calendar Sync
            </h1>
            <p className={`text-sm ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-300'} max-w-2xl leading-relaxed`}>
              Sync daily & weekly chore routines, inspection checkpoints, and helper duties directly to your family's Google Calendar with reminders and quality checklists.
            </p>
          </div>

          {/* Connection Status Box */}
          <div className={`${isGlassTheme(currentTheme) ? 'bg-white/10 backdrop-blur-md border-white/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] text-slate-900' : 'bg-white/10 backdrop-blur-md border-white/20 text-white'} border border-white/20 rounded-2xl p-4 min-w-[260px]`}>
            <div className={`text-xs font-medium mb-1 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-300'}`}>Status</div>
            {token ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {userInfo?.photoURL ? (
                    <img
                      src={userInfo.photoURL}
                      alt={userInfo.displayName || 'Google Account'}
                      className="w-8 h-8 rounded-full border border-emerald-400"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-400 flex items-center justify-center text-emerald-300 text-xs font-bold">
                      ✓
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {userInfo?.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-emerald-300 truncate">
                      {userInfo?.email || 'Calendar Connected'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-white/10">
                  <button
                    onClick={() => loadCalendars(token)}
                    disabled={isLoadingCalendars}
                    className="text-[11px] font-semibold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCalendars ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-xs text-amber-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Not Connected
                </div>
                <button
                  onClick={handleConnectGoogle}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-900 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-slate-200"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Connect Google Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : statusMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {statusMessage.type === 'info' && <Bell className="w-4 h-4 text-indigo-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Controls & Chore Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Calendar & Date Target Settings */}
        <div className="space-y-6">
          
          {/* Target Google Calendar Card */}
          <div className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'}`}>
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Target Google Calendar</span>
            </h3>

            {token ? (
              <div className="space-y-3">
                <label className={`block text-xs font-medium ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-700 dark:text-slate-300'}`}>
                  Select which Google Calendar to sync events to:
                </label>
                <select
                  value={selectedCalendarId}
                  onChange={(e) => handleCalendarChange(e.target.value)}
                  className={`w-full rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 border ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'}`}
                >
                  {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary} {cal.primary ? '(Primary)' : ''}
                    </option>
                  ))}
                  {calendars.length === 0 && (
                    <option value="primary">Primary Google Calendar</option>
                  )}
                </select>

                <div className="pt-2">
                  <button
                    onClick={handleCreateDedicatedCalendar}
                    disabled={isLoadingCalendars}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${isGlassTheme(currentTheme) ? 'bg-white/40 hover:bg-white/60 text-slate-900 border-white/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Dedicated "Family Chores" Calendar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl text-center space-y-3 ${isGlassTheme(currentTheme) ? 'bg-white/20 border border-white/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
                <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'}`}>Connect Google Calendar to select or create a shared family chore calendar.</p>
                <button
                  onClick={handleConnectGoogle}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Connect Now
                </button>
              </div>
            )}
          </div>

          {/* Sync Date & Trigger */}
          <div className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'}`}>
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Sync Date & Actions</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-700 dark:text-slate-300'}`}>
                  Target Schedule Date:
                </label>
                <input
                  type="date"
                  value={syncTargetDate}
                  onChange={(e) => setSyncTargetDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-indigo-500 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 text-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]' : 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'}`}
                />
              </div>

              <div className={`p-3 rounded-xl border text-[11px] leading-tight space-y-1 ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30 text-amber-900' : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-900/40 dark:text-amber-200'}`}>
                <div className="font-bold flex items-center gap-1">
                  <Bell className="w-3 h-3 text-amber-700" />
                  <span>Calendar Reminders Included:</span>
                </div>
                <p>Events include 15-minute popup alerts, inspection checklists, assigned child emoji, and points value.</p>
              </div>

              <button
                onClick={handleSyncSelectedChores}
                disabled={isSyncing}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${isGlassTheme(currentTheme) ? 'apple-glass-button-primary' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Syncing ({syncProgress?.current}/{syncProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>Sync Selected Chores to Google Calendar</span>
                  </>
                )}
              </button>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${isGlassTheme(currentTheme) ? 'border-white/20 hover:bg-white/40 text-slate-800' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'}`}
              >
                <span>Open Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Right 2 Columns: Chore Selection & Sync Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chore Selection List */}
          <div className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-base font-bold ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                  Chores to Include in Calendar Sync
                </h3>
                <p className={`text-xs ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                  Choose which routine tasks to push to the family schedule for {syncTargetDate}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => {
                    const all: { [id: string]: boolean } = {};
                    chores.forEach(c => { all[c.id] = true; });
                    setSelectedChoreIds(all);
                  }}
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className={`${isGlassTheme(currentTheme) ? 'text-slate-400' : 'text-slate-300'}`}>|</span>
                <button
                  onClick={() => setSelectedChoreIds({})}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  None
                </button>
              </div>
            </div>

            {/* Member Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <button
                onClick={() => setFilterMemberId('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors shrink-0 cursor-pointer ${
                  filterMemberId === 'all'
                    ? (isGlassTheme(currentTheme) ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs')
                    : (isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 hover:bg-white/50 border border-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')
                }`}
              >
                All Helpers ({chores.filter(c => c.isActive).length})
              </button>
              {members.map(m => {
                const count = chores.filter(c => c.isActive && c.assignedMemberId === m.id).length;
                return (
                  <button
                    key={m.id}
                    onClick={() => setFilterMemberId(m.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                      filterMemberId === m.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{m.avatarEmoji}</span>
                    <span>{m.name}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
              {chores
                .filter(c => c.isActive && (filterMemberId === 'all' || c.assignedMemberId === filterMemberId))
                .map(chore => {
                const member = members.find(m => m.id === chore.assignedMemberId);
                const isSelected = selectedChoreIds[chore.id] !== false;

                return (
                  <div 
                    key={chore.id}
                    className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      isSelected 
                        ? (isGlassTheme(currentTheme) ? 'bg-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'bg-white dark:bg-slate-800') 
                        : (isGlassTheme(currentTheme) ? 'bg-transparent opacity-60' : 'bg-slate-50/60 dark:bg-slate-900/60 opacity-60')
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => setSelectedChoreIds({
                          ...selectedChoreIds,
                          [chore.id]: e.target.checked,
                        })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                            {chore.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isGlassTheme(currentTheme) ? 'bg-white/30 text-slate-800 border border-white/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {chore.category}
                          </span>
                        </div>
                        <div className={`text-[11px] flex items-center gap-2 mt-0.5 ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                          <span>⏱️ {chore.estimatedMinutes}m</span>
                          <span>•</span>
                          <span className="capitalize">{chore.timeOfDay} slot</span>
                          <span>•</span>
                          <span>⭐ {chore.defaultPoints} pts</span>
                        </div>
                      </div>
                    </label>

                    {/* Assigned member badge */}
                    <div className="text-xs">
                      {member ? (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border ${isGlassTheme(currentTheme) ? 'bg-white/30 border-white/20 text-slate-900' : 'bg-amber-50 border-amber-200 text-slate-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'}`}>
                          <span>{member.avatarEmoji}</span>
                          <span>{member.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync History Logs */}
          <div className={`rounded-3xl p-6 border shadow-xs space-y-4 ${isGlassTheme(currentTheme) ? 'apple-glass-card border-white/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isGlassTheme(currentTheme) ? 'text-slate-800' : 'text-slate-600 dark:text-slate-400'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recent Google Calendar Syncs ({syncLogs.length})</span>
              </h3>

              {syncLogs.length > 0 && (
                <button
                  onClick={() => {
                    setSyncLogs([]);
                    saveSyncLogs([]);
                  }}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {syncLogs.length === 0 ? (
              <div className={`text-center py-8 text-xs rounded-2xl border border-dashed ${isGlassTheme(currentTheme) ? 'text-slate-600 bg-white/10 border-white/30' : 'text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                No Google Calendar sync events logged yet. Connect and click "Sync Selected Chores".
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {syncLogs.slice(0, 10).map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${isGlassTheme(currentTheme) ? 'bg-white/20 border-white/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold truncate ${isGlassTheme(currentTheme) ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}>{log.choreTitle}</div>
                        <div className={`text-[11px] ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                          {log.memberName} • {log.date} at {log.syncedAt}
                        </div>
                      </div>
                    </div>

                    {log.htmlLink && (
                      <a
                        href={log.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1 shrink-0 bg-indigo-50 px-2 py-1 rounded-md"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
