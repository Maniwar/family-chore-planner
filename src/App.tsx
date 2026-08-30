/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  loadStoredMembers, 
  saveMembers, 
  loadStoredChores, 
  saveChores, 
  loadStoredLogs, 
  saveLogs, 
  loadStoredRewards, 
  saveRewards, 
  loadStoredClaims, 
  saveClaims,
  loadStoredHouseholdInfo,
  saveHouseholdInfo,
  DEFAULT_HOUSEHOLD_INFO,
  resetAllToDemo, 
  getTodayDateString, 
  triggerConfettiCelebration, 
  triggerBigCelebration,
  loadStoredPenaltySettings,
  savePenaltySettings,
  loadStoredEvents,
  saveEvents,
  loadStoredNudges,
  saveNudges,
  loadStoredDailyLayout,
  saveDailyLayout,
  DEFAULT_PENALTY_SETTINGS
} from './utils/storage';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardItem, RewardClaim, ViewMode, HouseholdInfo, HouseholdPenaltySettings, ChoreEvent, NudgeRecord } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DailyScheduleView } from './components/DailyScheduleView';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { InspectionQueueView } from './components/InspectionQueueView';
import { StatusView } from './components/StatusView';
import { ChoreLibraryView } from './components/ChoreLibraryView';
import { FamilyMembersView } from './components/FamilyMembersView';
import { RewardsView } from './components/RewardsView';
import { RedemptionsManagerView } from './components/RedemptionsManagerView';
import { ReportsAndPrintView } from './components/ReportsAndPrintView';
import { InspectionModal } from './components/InspectionModal';
import { ChoreModal } from './components/ChoreModal';
import { MemberModal } from './components/MemberModal';
import { HouseSettingsModal } from './components/HouseSettingsModal';
import { AIAssignModal } from './components/AIAssignModal';
import { GoogleCalendarView } from './components/GoogleCalendarView';
import { ParentPinModal } from './components/ParentPinModal';
import { HouseholdSyncModal } from './components/HouseholdSyncModal';
import { QuickSettingsModal } from './components/QuickSettingsModal';
import { soundFX } from './utils/audio';
import { SupportedLanguage, getTranslation } from './utils/i18n';
import { ThemePreset, THEMES } from './utils/theme';
import { evaluateHouseholdStatus, calculateInspectionAward, calculateDaysLate } from './utils/penaltyEngine';
import { isPinProtectionEnabled, isParentSessionUnlocked, setParentSessionUnlocked, syncParentPinFromCloud, getParentPin } from './utils/parentLock';
import { 
  CloudHousehold, 
  getCurrentHouseholdId, 
  setCurrentHouseholdId,
  findHouseholdByCode,
  getHousehold, 
  getPrimaryHousehold,
  subscribeHouseholdFull,
  syncCompleteHouseholdToCloud
} from './utils/firebaseSync';

export default function App() {
  // Core application state with LocalStorage persistence & Cloud sync
  const [members, setMembers] = useState<HouseholdMember[]>(() => loadStoredMembers());
  const [chores, setChores] = useState<Chore[]>(() => loadStoredChores());
  const [logs, setLogs] = useState<ChoreAssignmentLog[]>(() => loadStoredLogs());
  const [rewards, setRewards] = useState<RewardItem[]>(() => loadStoredRewards());
  const [claims, setClaims] = useState<RewardClaim[]>(() => loadStoredClaims());
  const [householdInfo, setHouseholdInfo] = useState<HouseholdInfo>(() => loadStoredHouseholdInfo());
  const [penaltySettings, setPenaltySettings] = useState<HouseholdPenaltySettings>(() => loadStoredPenaltySettings());
  const [events, setEvents] = useState<ChoreEvent[]>(() => loadStoredEvents());
  const [nudges, setNudges] = useState<NudgeRecord[]>(() => loadStoredNudges());
  const [activeNudgeBanner, setActiveNudgeBanner] = useState<NudgeRecord | null>(null);

  // Cloud multi-tenant household state
  const [activeHousehold, setActiveHousehold] = useState<CloudHousehold | null>(null);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);

  // Deduplication & hydration refs to prevent bouncing echoes or premature clobbers between devices
  const lastSyncedHashRef = useRef<string>('');
  const isReceivingRemoteUpdateRef = useRef<boolean>(false);
  const isCloudHydratedRef = useRef<boolean>(false);

  const [currentDateStr, setCurrentDateStr] = useState<string>(getTodayDateString());
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [isMomMode, setIsMomMode] = useState<boolean>(true);

  // Localization & Theme states
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      return (localStorage.getItem('family_chore_lang') as SupportedLanguage) || 'en';
    } catch {
      return 'en';
    }
  });

  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => {
    try {
      return (localStorage.getItem('family_chore_theme') as ThemePreset) || 'rose';
    } catch {
      return 'rose';
    }
  });

  const theme = THEMES[currentTheme] || THEMES.rose;

  // Sync document.documentElement 'dark' class with theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme.isDark]);

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => soundFX.getEnabled());

  const t = getTranslation(language);

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    try {
      localStorage.setItem('family_chore_lang', lang);
    } catch {}
  };

  const handleSelectTheme = (thm: ThemePreset) => {
    setCurrentTheme(thm);
    try {
      localStorage.setItem('family_chore_theme', thm);
    } catch {}
  };

  const handleToggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    soundFX.setEnabled(next);
  };

  // Modals state
  const [isAIAssignModalOpen, setIsAIAssignModalOpen] = useState<boolean>(false);
  const [aiAssignInitialTab, setAiAssignInitialTab] = useState<'assigner' | 'creator' | 'coach'>('assigner');
  const [isHouseSettingsModalOpen, setIsHouseSettingsModalOpen] = useState<boolean>(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);

  const [inspectModalData, setInspectModalData] = useState<{
    isOpen: boolean;
    chore: Chore | null;
    log: ChoreAssignmentLog | null;
  }>({
    isOpen: false,
    chore: null,
    log: null,
  });

  const [choreModalData, setChoreModalData] = useState<{
    isOpen: boolean;
    choreToEdit: Chore | null;
  }>({
    isOpen: false,
    choreToEdit: null,
  });

  const [memberModalData, setMemberModalData] = useState<{
    isOpen: boolean;
    memberToEdit: HouseholdMember | null;
  }>({
    isOpen: false,
    memberToEdit: null,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dailyViewMode, setDailyViewMode] = useState<'list' | 'grid'>(() => loadStoredDailyLayout());

  // Parent PIN Security States
  const [isParentPinModalOpen, setIsParentPinModalOpen] = useState<boolean>(false);
  const [pinModalTitle, setPinModalTitle] = useState<string>('Mom / Parent Mode Access');
  const [pinModalDesc, setPinModalDesc] = useState<string>('Enter the 4-digit Parent PIN to unlock admin privileges.');
  const [pendingParentAuthCallback, setPendingParentAuthCallback] = useState<(() => void) | null>(null);

  const requestParentAuth = (onSuccess: () => void, title?: string, desc?: string) => {
    if (!isPinProtectionEnabled() || isParentSessionUnlocked()) {
      onSuccess();
      return;
    }
    if (title) setPinModalTitle(title);
    if (desc) setPinModalDesc(desc);
    setPendingParentAuthCallback(() => onSuccess);
    setIsParentPinModalOpen(true);
  };

  const handleToggleMomMode = () => {
    if (isMomMode) {
      // Switching to Kid Mode: Lock parent session and switch view
      setIsMomMode(false);
      setParentSessionUnlocked(false);
      if (currentView === 'inspection' || currentView === 'library') {
        setCurrentView('today');
      }
      soundFX.playPop();
      showToast('Mom Mode locked 🔒 Switched to Helper / Kid View');
    } else {
      // Switching into Mom Mode: Require PIN
      requestParentAuth(
        () => {
          setIsMomMode(true);
          soundFX.playRewardCoin();
          showToast('Mom / Admin Mode unlocked! 👑');
        },
        'Unlock Mom / Admin Mode',
        'Enter your 4-digit Parent PIN to inspect chores, adjust points, and change household rules.'
      );
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Local storage persistence
  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveChores(chores);
  }, [chores]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveRewards(rewards);
  }, [rewards]);

  useEffect(() => {
    saveClaims(claims);
  }, [claims]);

  useEffect(() => {
    saveHouseholdInfo(householdInfo);
  }, [householdInfo]);

  useEffect(() => {
    savePenaltySettings(penaltySettings);
  }, [penaltySettings]);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveNudges(nudges);
  }, [nudges]);

  // Auto-connect via Invite Link / URL parameter OR auto-hydrate primary household
  useEffect(() => {
    let isMounted = true;

    async function initializeCloudSession() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('join') || urlParams.get('code') || urlParams.get('hh') || urlParams.get('household');
        
        let targetHh: CloudHousehold | null = null;

        if (inviteCode) {
          targetHh = await findHouseholdByCode(inviteCode);
          if (targetHh) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        if (!targetHh) {
          const savedHhId = getCurrentHouseholdId();
          if (savedHhId) {
            targetHh = await getHousehold(savedHhId);
          }
        }

        // If still no household found (e.g. fresh phone/tablet opening the app for the first time),
        // fetch the primary family household from server/cloud so all devices share the same live state
        if (!targetHh) {
          targetHh = await getPrimaryHousehold();
        }

        if (targetHh && isMounted) {
          setCurrentHouseholdId(targetHh.id);
          setActiveHousehold(targetHh);

          // Synchronize Mom PIN & settings
          if (targetHh.adminPin || targetHh.pinProtectionEnabled !== undefined) {
            syncParentPinFromCloud(targetHh.adminPin, targetHh.pinProtectionEnabled);
          }

          if (targetHh.members && targetHh.members.length > 0) {
            setMembers(prevMembers => {
              return targetHh!.members!.map(tm => {
                const localMatch = prevMembers.find(lm => lm.id === tm.id);
                if (localMatch?.avatarPhotoUrl && (!tm.avatarPhotoUrl || tm.avatarPhotoUrl.trim() === '')) {
                  return {
                    ...tm,
                    avatarPhotoUrl: localMatch.avatarPhotoUrl,
                  };
                }
                return tm;
              });
            });
          }
          if (targetHh.chores && targetHh.chores.length > 0) setChores(targetHh.chores);
          if (targetHh.logs) setLogs(targetHh.logs);
          if (targetHh.rewards && targetHh.rewards.length > 0) setRewards(targetHh.rewards);
          if (targetHh.claims) setClaims(targetHh.claims);
          if (targetHh.penaltySettings) setPenaltySettings(targetHh.penaltySettings);
          if (targetHh.events) setEvents(targetHh.events);
          if (targetHh.nudges) setNudges(targetHh.nudges);

          setHouseholdInfo(prev => ({
            ...prev,
            familyName: targetHh!.familyName || prev.familyName,
            houseAddressOrMotto: targetHh!.houseAddressOrMotto || prev.houseAddressOrMotto,
            housePhotoUrl: targetHh!.housePhotoUrl || prev.housePhotoUrl,
            householdCode: targetHh!.householdCode,
            householdId: targetHh!.id,
            isCloudSynced: true,
          }));

          // Set hash baseline so debounced effect does not push identical copy
          lastSyncedHashRef.current = JSON.stringify({
            familyName: targetHh.familyName,
            houseAddressOrMotto: targetHh.houseAddressOrMotto,
            housePhotoUrl: targetHh.housePhotoUrl,
            householdCode: targetHh.householdCode,
            adminPin: targetHh.adminPin || getParentPin(),
            pinProtectionEnabled: targetHh.pinProtectionEnabled !== undefined ? targetHh.pinProtectionEnabled : isPinProtectionEnabled(),
            members: targetHh.members || members,
            chores: targetHh.chores || chores,
            logs: targetHh.logs || logs,
            rewards: targetHh.rewards || rewards,
            claims: targetHh.claims || claims,
            penaltySettings: targetHh.penaltySettings || penaltySettings,
            events: targetHh.events || events,
            nudges: targetHh.nudges || nudges,
          });

          isCloudHydratedRef.current = true;
        } else if (isMounted) {
          isCloudHydratedRef.current = true;
        }
      } catch (err) {
        console.warn('Initialization notice:', err);
        if (isMounted) isCloudHydratedRef.current = true;
      }
    }

    initializeCloudSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced cloud sync to prevent quota exhaustion and duplicate sync echoes
  useEffect(() => {
    if (!isCloudHydratedRef.current) return;
    if (!activeHousehold?.id) return;
    if (isReceivingRemoteUpdateRef.current) return;

    const dataPayload = {
      familyName: householdInfo.familyName,
      houseAddressOrMotto: householdInfo.houseAddressOrMotto,
      housePhotoUrl: householdInfo.housePhotoUrl,
      householdCode: activeHousehold.householdCode,
      adminPin: getParentPin(),
      pinProtectionEnabled: isPinProtectionEnabled(),
      members,
      chores,
      logs,
      rewards,
      claims,
      penaltySettings,
      events,
      nudges,
    };

    const currentHash = JSON.stringify(dataPayload);
    if (currentHash === lastSyncedHashRef.current) return;

    const timer = setTimeout(() => {
      lastSyncedHashRef.current = currentHash;
      syncCompleteHouseholdToCloud(activeHousehold.id, dataPayload).catch(console.warn);
    }, 600);

    return () => clearTimeout(timer);
  }, [members, chores, logs, rewards, claims, penaltySettings, events, nudges, householdInfo, activeHousehold?.id]);

  // Real-time Cloud Sync Subscription (Dual Firestore + Fast Polling Engine)
  useEffect(() => {
    const targetHhId = activeHousehold?.id || getCurrentHouseholdId();
    if (!targetHhId) return;

    let isMounted = true;

    // Real-time multi-device subscription (listens for Firestore events or 2s server polling)
    const unsubscribe = subscribeHouseholdFull(targetHhId, (cloudHh) => {
      if (!isMounted) return;
      isReceivingRemoteUpdateRef.current = true;

      setActiveHousehold(cloudHh);
      if (cloudHh.adminPin || cloudHh.pinProtectionEnabled !== undefined) {
        syncParentPinFromCloud(cloudHh.adminPin, cloudHh.pinProtectionEnabled);
      }
      if (cloudHh.members && cloudHh.members.length > 0) {
        setMembers(prevMembers => {
          return cloudHh.members!.map(cm => {
            const localMatch = prevMembers.find(lm => lm.id === cm.id);
            if (localMatch?.avatarPhotoUrl && (!cm.avatarPhotoUrl || cm.avatarPhotoUrl.trim() === '')) {
              return {
                ...cm,
                avatarPhotoUrl: localMatch.avatarPhotoUrl,
              };
            }
            return cm;
          });
        });
      }
      if (cloudHh.chores && cloudHh.chores.length > 0) setChores(cloudHh.chores);
      if (cloudHh.logs) setLogs(cloudHh.logs);
      if (cloudHh.rewards && cloudHh.rewards.length > 0) setRewards(cloudHh.rewards);
      if (cloudHh.claims) setClaims(cloudHh.claims);
      if (cloudHh.penaltySettings) setPenaltySettings(cloudHh.penaltySettings);
      if (cloudHh.events) setEvents(cloudHh.events);
      if (cloudHh.nudges) setNudges(cloudHh.nudges);

      setHouseholdInfo(prev => ({
        ...prev,
        familyName: cloudHh.familyName || prev.familyName,
        houseAddressOrMotto: cloudHh.houseAddressOrMotto || prev.houseAddressOrMotto,
        housePhotoUrl: cloudHh.housePhotoUrl || prev.housePhotoUrl,
        householdCode: cloudHh.householdCode,
        householdId: cloudHh.id,
        isCloudSynced: true,
      }));

      // Update hash so we don't reflect this remote update back to the server
      lastSyncedHashRef.current = JSON.stringify({
        familyName: cloudHh.familyName,
        houseAddressOrMotto: cloudHh.houseAddressOrMotto,
        housePhotoUrl: cloudHh.housePhotoUrl,
        householdCode: cloudHh.householdCode,
        adminPin: cloudHh.adminPin || getParentPin(),
        pinProtectionEnabled: cloudHh.pinProtectionEnabled !== undefined ? cloudHh.pinProtectionEnabled : isPinProtectionEnabled(),
        members: cloudHh.members,
        chores: cloudHh.chores,
        logs: cloudHh.logs,
        rewards: cloudHh.rewards,
        claims: cloudHh.claims,
        penaltySettings: cloudHh.penaltySettings,
        events: cloudHh.events,
        nudges: cloudHh.nudges,
      });

      setTimeout(() => {
        isReceivingRemoteUpdateRef.current = false;
      }, 100);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeHousehold?.id]);

  const handleHouseholdConnected = (household: CloudHousehold) => {
    isCloudHydratedRef.current = true;
    setActiveHousehold(household);
    if (household.adminPin || household.pinProtectionEnabled !== undefined) {
      syncParentPinFromCloud(household.adminPin, household.pinProtectionEnabled);
    }
    if (household.members && household.members.length > 0) setMembers(household.members);
    if (household.chores && household.chores.length > 0) setChores(household.chores);
    if (household.logs && household.logs.length > 0) setLogs(household.logs);
    if (household.rewards && household.rewards.length > 0) setRewards(household.rewards);
    if (household.claims && household.claims.length > 0) setClaims(household.claims);
    if (household.events && household.events.length > 0) setEvents(household.events);
    if (household.nudges && household.nudges.length > 0) setNudges(household.nudges);
    if (household.penaltySettings) setPenaltySettings(household.penaltySettings);

    setHouseholdInfo(prev => ({
      ...prev,
      familyName: household.familyName,
      houseAddressOrMotto: household.houseAddressOrMotto,
      housePhotoUrl: household.housePhotoUrl,
      householdCode: household.householdCode,
      householdId: household.id,
      isCloudSynced: true,
    }));
  };

  const handleHouseholdDisconnected = () => {
    setActiveHousehold(null);
    setHouseholdInfo(prev => ({
      ...prev,
      householdCode: undefined,
      householdId: undefined,
      isCloudSynced: false,
    }));
  };

  // Pending inspections count
  const pendingInspectionCount = logs.filter(l => l.status === 'needs_review').length;
  const pendingRewardCount = claims.filter(c => c.status === 'pending').length;

  // Handlers
  const handleMarkComplete = (choreId: string, notes?: string, checklist?: { [key: number]: boolean }) => {
    const existingIndex = logs.findIndex(l => l.choreId === choreId && l.date === currentDateStr);
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    soundFX.playComplete();

    if (existingIndex >= 0) {
      const updated = [...logs];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: isMomMode ? 'approved' : 'needs_review',
        completedAt: new Date().toISOString(),
        qualityScore: isMomMode ? 5 : undefined,
        pointsAwarded: isMomMode ? chore.defaultPoints : undefined,
        completedNote: notes || updated[existingIndex].completedNote,
        checklistStatus: checklist || updated[existingIndex].checklistStatus,
      };
      setLogs(updated);

      if (isMomMode) {
        setMembers(prev => prev.map(m => {
          if (m.id === chore.assignedMemberId) {
            return {
              ...m,
              currentPoints: m.currentPoints + chore.defaultPoints,
              lifetimePoints: m.lifetimePoints + chore.defaultPoints,
              starsCount: m.starsCount + 1,
            };
          }
          return m;
        }));
        triggerConfettiCelebration();
        soundFX.playRewardCoin();
        showToast(`Chore verified & ${chore.defaultPoints} points awarded to helper!`);
      } else {
        showToast('Chore submitted for inspection! Mom has been notified.');
      }
    } else {
      const newLog: ChoreAssignmentLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        choreId,
        memberId: chore.assignedMemberId || 'unassigned',
        date: currentDateStr,
        status: isMomMode ? 'approved' : 'needs_review',
        completedAt: new Date().toISOString(),
        qualityScore: isMomMode ? 5 : undefined,
        pointsAwarded: isMomMode ? chore.defaultPoints : undefined,
        completedNote: notes,
        checklistStatus: checklist,
      };
      setLogs([...logs, newLog]);

      if (isMomMode) {
        setMembers(prev => prev.map(m => {
          if (m.id === chore.assignedMemberId) {
            return {
              ...m,
              currentPoints: m.currentPoints + chore.defaultPoints,
              lifetimePoints: m.lifetimePoints + chore.defaultPoints,
              starsCount: m.starsCount + 1,
            };
          }
          return m;
        }));
        triggerConfettiCelebration();
        soundFX.playRewardCoin();
        showToast(`Chore verified & ${chore.defaultPoints} points awarded!`);
      } else {
        showToast('Chore marked done! Mom will inspect and award stars soon.');
      }
    }
  };

  const handleQuickApprove = (choreId: string, logId: string) => {
    const targetLog = logs.find(l => l.id === logId) || logs.find(l => l.choreId === choreId && l.date === currentDateStr);
    const chore = chores.find(c => c.id === choreId);
    const pointsToAward = chore ? chore.defaultPoints : 10;

    if (targetLog) {
      setLogs(prev => prev.map(l => {
        if (l.id === targetLog.id) {
          return {
            ...l,
            status: 'approved',
            qualityScore: 5,
            pointsAwarded: pointsToAward,
            bonusPoints: 0,
            reviewedAt: new Date().toISOString(),
          };
        }
        return l;
      }));

      setMembers(prev => prev.map(m => {
        if (m.id === targetLog.memberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + pointsToAward,
            lifetimePoints: m.lifetimePoints + pointsToAward,
            starsCount: m.starsCount + 1,
          };
        }
        return m;
      }));
    } else if (chore) {
      const newLog: ChoreAssignmentLog = {
        id: `log_${Date.now()}`,
        choreId: chore.id,
        memberId: chore.assignedMemberId,
        date: currentDateStr,
        status: 'approved',
        completedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        qualityScore: 5,
        pointsAwarded: pointsToAward,
      };
      setLogs(prev => [...prev, newLog]);

      setMembers(prev => prev.map(m => {
        if (m.id === chore.assignedMemberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + pointsToAward,
            lifetimePoints: m.lifetimePoints + pointsToAward,
            starsCount: m.starsCount + 1,
          };
        }
        return m;
      }));
    }

    triggerConfettiCelebration();
    soundFX.playRewardCoin();
    showToast(`Approved! Awarded 5 Stars & ${pointsToAward} pts.`);
  };

  const handleBatchApproveAll = (logsToApprove?: { chore: Chore; log: ChoreAssignmentLog }[]) => {
    const items = logsToApprove && logsToApprove.length > 0 
      ? logsToApprove 
      : logs.filter(l => l.status === 'needs_review').map(l => ({ chore: chores.find(c => c.id === l.choreId)!, log: l })).filter(item => Boolean(item.chore));

    if (items.length === 0) return;

    let pointsAwardedMap: Record<string, number> = {};
    const logIdsToApprove = new Set(items.map(i => i.log.id));

    const updatedLogs = logs.map(l => {
      if (logIdsToApprove.has(l.id)) {
        const chore = chores.find(c => c.id === l.choreId);
        const pts = chore ? chore.defaultPoints : 10;
        pointsAwardedMap[l.memberId] = (pointsAwardedMap[l.memberId] || 0) + pts;

        return {
          ...l,
          status: 'approved' as const,
          qualityScore: 5,
          pointsAwarded: pts,
          reviewedAt: new Date().toISOString(),
        };
      }
      return l;
    });

    setLogs(updatedLogs);

    setMembers(prev => prev.map(m => {
      const added = pointsAwardedMap[m.id] || 0;
      if (added > 0) {
        return {
          ...m,
          currentPoints: m.currentPoints + added,
          lifetimePoints: m.lifetimePoints + added,
          starsCount: m.starsCount + 1,
        };
      }
      return m;
    }));

    triggerBigCelebration();
    soundFX.playRewardCoin();
    showToast(`All ${items.length} pending chores approved in batch! Great job everyone!`);
  };

  const handleOpenInspect = (chore: Chore, log: ChoreAssignmentLog | null) => {
    soundFX.playPop();
    setInspectModalData({
      isOpen: true,
      chore,
      log,
    });
  };

  const handleSaveGrading = (
    logId: string,
    score: number,
    grade: 'A+' | 'A' | 'B' | 'C' | 'Redo',
    bonusPoints: number,
    feedbackNote: string,
    checklistStatus: { [key: number]: boolean },
    isRedo: boolean
  ) => {
    if (!inspectModalData.chore) return;
    const { chore, log } = inspectModalData;
    const memberId = chore.assignedMemberId || log?.memberId || 'unassigned';
    const daysLate = calculateDaysLate(chore, log, currentDateStr, penaltySettings);
    
    // Calculate effective award points factoring in lateness and quality multipliers
    const awardResult = calculateInspectionAward(
      chore.defaultPoints,
      grade,
      daysLate,
      log?.penaltyWaived,
      penaltySettings
    );

    const newStatus = isRedo ? 'needs_redo' : 'approved';
    const finalPointsAwarded = isRedo ? 0 : awardResult.finalPoints + (bonusPoints || 0);

    if (log) {
      setLogs(prev => prev.map(l => {
        if (l.id === log.id) {
          return {
            ...l,
            status: newStatus,
            qualityScore: score,
            qualityGrade: grade,
            pointsAwarded: isRedo ? 0 : awardResult.finalPoints,
            bonusPoints: isRedo ? 0 : bonusPoints,
            feedbackNote,
            checklistStatus,
            reviewedAt: new Date().toISOString(),
            daysLate: daysLate,
          };
        }
        return l;
      }));
    } else {
      const newLog: ChoreAssignmentLog = {
        id: logId,
        choreId: chore.id,
        memberId: memberId,
        date: currentDateStr,
        status: newStatus,
        completedAt: new Date().toISOString(),
        qualityScore: score,
        qualityGrade: grade,
        pointsAwarded: isRedo ? 0 : awardResult.finalPoints,
        bonusPoints: isRedo ? 0 : bonusPoints,
        feedbackNote,
        checklistStatus,
        reviewedAt: new Date().toISOString(),
        daysLate: daysLate,
      };
      setLogs(prev => [...prev, newLog]);
    }

    if (!isRedo && finalPointsAwarded > 0) {
      setMembers(prev => prev.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + finalPointsAwarded,
            lifetimePoints: m.lifetimePoints + finalPointsAwarded,
            starsCount: score === 5 ? m.starsCount + 1 : m.starsCount,
          };
        }
        return m;
      }));

      if (score === 5) {
        triggerBigCelebration();
      } else {
        triggerConfettiCelebration();
      }
      soundFX.playRewardCoin();
      showToast(`Approved! Awarded ${grade} (${score}⭐) and ${finalPointsAwarded} points.`);
    } else if (isRedo) {
      soundFX.playPop();
      const member = members.find(m => m.id === memberId);
      const redoEvent: ChoreEvent = {
        id: `evt_redo_${Date.now()}`,
        householdId: activeHousehold?.id || 'default',
        type: 'failed_inspection',
        memberId: memberId,
        memberName: member?.name || 'Helper',
        choreId: chore.id,
        choreTitle: chore.title || 'Chore',
        reason: feedbackNote ? `Quality Redo: "${feedbackNote}"` : 'Needs Redo / Quality correction requested during parent inspection',
        weekNumber: 35,
        year: 2026,
        createdAt: new Date().toISOString(),
      };
      setEvents(prev => [redoEvent, ...prev]);
      showToast(`Chore marked for Redo. Feedback left for helper.`);
    } else {
      soundFX.playPop();
      showToast(`Approved! ${finalPointsAwarded} points awarded.`);
    }

    setInspectModalData({ isOpen: false, chore: null, log: null });
  };

  // Status & Penalty Administration Handlers
  const handleSendNudge = async (
    memberId: string, 
    memberName: string, 
    message: string, 
    choreId?: string, 
    choreTitle?: string
  ) => {
    const now = new Date().toISOString();
    const hhId = activeHousehold?.id || 'default';
    const newNudge: NudgeRecord = {
      id: `nudge_${Date.now()}`,
      householdId: hhId,
      memberId,
      memberName,
      senderRole: 'parent',
      senderName: 'Mom / Parent',
      choreId,
      choreTitle,
      message,
      createdAt: now,
      acknowledged: false,
    };

    const newEvent: ChoreEvent = {
      id: `evt_${Date.now()}`,
      householdId: hhId,
      type: 'nudge_sent',
      memberId,
      memberName,
      choreId,
      choreTitle,
      reason: `Nudge reminder: "${message}"`,
      createdAt: now,
      weekNumber: 35,
      year: 2026,
    };

    const updatedNudges = [newNudge, ...nudges];
    const updatedEvents = [newEvent, ...events];

    setNudges(updatedNudges);
    setEvents(updatedEvents);
    showToast(`Nudge delivered to ${memberName}! 🔔`);

    // Call server endpoint
    if (activeHousehold?.id) {
      fetch(`/api/household/${encodeURIComponent(activeHousehold.id)}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNudge),
      }).catch(console.warn);

      syncCompleteHouseholdToCloud(activeHousehold.id, {
        nudges: updatedNudges,
        events: updatedEvents,
      }).catch(console.warn);
    }
  };

  const handleWaivePenalty = (
    choreId: string, 
    logId: string, 
    memberId: string, 
    reason: string,
    choreDate?: string
  ) => {
    const now = new Date().toISOString();
    const member = members.find(m => m.id === memberId);
    const chore = chores.find(c => c.id === choreId);
    const hhId = activeHousehold?.id || 'default';
    const targetDate = choreDate || (logId && logId.includes('_') ? logId.split('_')[2] : undefined) || currentDateStr;

    const existingIndex = logs.findIndex(l => 
      l.id === logId || 
      (l.choreId === choreId && l.memberId === memberId && (targetDate ? l.date === targetDate : true))
    );

    let updatedLogs: ChoreAssignmentLog[];
    if (existingIndex >= 0) {
      updatedLogs = logs.map((l, idx) => {
        if (idx === existingIndex || l.id === logId) {
          return {
            ...l,
            penaltyWaived: true,
            penaltyWaivedReason: reason,
            status: l.status === 'pending' || l.status === 'needs_redo' ? 'approved' as const : l.status,
            reviewedAt: now,
          };
        }
        return l;
      });
    } else {
      const newLog: ChoreAssignmentLog = {
        id: logId && logId.startsWith('log_') ? logId : `log_${choreId}_${targetDate}_${Date.now()}`,
        choreId,
        memberId,
        date: targetDate,
        originalDueDate: targetDate,
        status: 'approved',
        penaltyWaived: true,
        penaltyWaivedReason: reason,
        reviewedAt: now,
      };
      updatedLogs = [...logs, newLog];
    }

    const newEvent: ChoreEvent = {
      id: `evt_${Date.now()}`,
      householdId: hhId,
      type: 'penalty_waived',
      memberId,
      memberName: member?.name || 'Helper',
      choreId,
      choreTitle: chore?.title || 'Chore',
      reason: `Waiver granted for ${targetDate}: ${reason}`,
      createdAt: now,
      weekNumber: 35,
      year: 2026,
    };

    const updatedEvents = [newEvent, ...events];
    setLogs(updatedLogs);
    setEvents(updatedEvents);
    showToast(`Penalty waived for ${member?.name || 'Helper'} on ${chore?.title || 'task'}! ⭐`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        logs: updatedLogs,
        events: updatedEvents,
      }).catch(console.warn);
    }
  };

  const handleBatchWaivePenalties = (
    itemsToWaive: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[],
    reason: string
  ) => {
    const now = new Date().toISOString();
    const hhId = activeHousehold?.id || 'default';

    const newLogsToAdd: ChoreAssignmentLog[] = [];
    const updatedLogs = logs.map(l => {
      const match = itemsToWaive.find(i => 
        (i.logId && l.id === i.logId) || 
        (l.choreId === i.choreId && l.memberId === i.memberId && l.date === i.date)
      );
      if (match) {
        return {
          ...l,
          penaltyWaived: true,
          penaltyWaivedReason: reason,
          status: l.status === 'pending' || l.status === 'needs_redo' ? 'approved' as const : l.status,
          reviewedAt: now,
        };
      }
      return l;
    });

    // Check for items that did not have an existing log in logs
    itemsToWaive.forEach(item => {
      const exists = updatedLogs.some(l => 
        (item.logId && l.id === item.logId) || 
        (l.choreId === item.choreId && l.memberId === item.memberId && l.date === item.date)
      );
      if (!exists) {
        newLogsToAdd.push({
          id: item.logId || `log_${item.choreId}_${item.date}_${Date.now()}`,
          choreId: item.choreId,
          memberId: item.memberId,
          date: item.date,
          originalDueDate: item.date,
          status: 'approved',
          penaltyWaived: true,
          penaltyWaivedReason: reason,
          reviewedAt: now,
        });
      }
    });

    const finalLogs = [...updatedLogs, ...newLogsToAdd];

    const firstMember = members.find(m => m.id === itemsToWaive[0]?.memberId);
    const newEvent: ChoreEvent = {
      id: `evt_${Date.now()}`,
      householdId: hhId,
      type: 'penalty_waived',
      memberId: itemsToWaive[0]?.memberId || 'household',
      memberName: firstMember?.name || 'Household',
      reason: `Batch waiver granted for ${itemsToWaive.length} overdue task(s): ${reason}`,
      createdAt: now,
      weekNumber: 35,
      year: 2026,
    };

    const updatedEvents = [newEvent, ...events];
    setLogs(finalLogs);
    setEvents(updatedEvents);
    triggerConfettiCelebration();
    soundFX.playStarChime(5);
    showToast(`Waived ${itemsToWaive.length} overdue task(s)! ⭐`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        logs: finalLogs,
        events: updatedEvents,
      }).catch(console.warn);
    }
  };

  const handleExtendDueDate = (
    choreId: string, 
    logId: string, 
    memberId: string, 
    newDueDate: string, 
    reason: string,
    choreDate?: string
  ) => {
    const now = new Date().toISOString();
    const member = members.find(m => m.id === memberId);
    const chore = chores.find(c => c.id === choreId);
    const hhId = activeHousehold?.id || 'default';
    const targetDate = choreDate || (logId && logId.includes('_') ? logId.split('_')[2] : undefined) || currentDateStr;

    const existingIndex = logs.findIndex(l => 
      l.id === logId || 
      (l.choreId === choreId && l.memberId === memberId && (targetDate ? l.date === targetDate : true))
    );

    let updatedLogs: ChoreAssignmentLog[];
    if (existingIndex >= 0) {
      updatedLogs = logs.map((l, idx) => {
        if (idx === existingIndex || l.id === logId) {
          return {
            ...l,
            extendedDueDate: newDueDate,
            penaltyWaivedReason: reason,
          };
        }
        return l;
      });
    } else {
      const newLog: ChoreAssignmentLog = {
        id: logId && logId.startsWith('log_') ? logId : `log_${choreId}_${targetDate}_${Date.now()}`,
        choreId,
        memberId,
        date: targetDate,
        originalDueDate: targetDate,
        extendedDueDate: newDueDate,
        status: 'pending',
        penaltyWaivedReason: reason,
      };
      updatedLogs = [...logs, newLog];
    }

    const newEvent: ChoreEvent = {
      id: `evt_${Date.now()}`,
      householdId: hhId,
      type: 'due_extended',
      memberId,
      memberName: member?.name || 'Helper',
      choreId,
      choreTitle: chore?.title || 'Chore',
      reason: `Due date for ${targetDate} extended to ${newDueDate}: ${reason}`,
      createdAt: now,
      weekNumber: 35,
      year: 2026,
    };

    const updatedEvents = [newEvent, ...events];
    setLogs(updatedLogs);
    setEvents(updatedEvents);
    showToast(`Due date extended to ${newDueDate}! 📅`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        logs: updatedLogs,
        events: updatedEvents,
      }).catch(console.warn);
    }
  };

  const handleUpdatePenaltySettings = (newSettings: HouseholdPenaltySettings) => {
    setPenaltySettings(newSettings);
    showToast('Penalty & grade rules updated!');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        penaltySettings: newSettings,
      }).catch(console.warn);
    }
  };

  // Check unread nudges for currently selected member
  useEffect(() => {
    if (selectedMemberId && selectedMemberId !== 'all') {
      const unread = nudges.find(n => n.memberId === selectedMemberId && !n.isRead);
      if (unread) {
        setActiveNudgeBanner(unread);
        soundFX.playPop();
      } else {
        setActiveNudgeBanner(null);
      }
    } else {
      setActiveNudgeBanner(null);
    }
  }, [selectedMemberId, nudges]);

  const handleDismissNudge = (nudgeId: string) => {
    const updated = nudges.map(n => n.id === nudgeId ? { ...n, isRead: true } : n);
    setNudges(updated);
    setActiveNudgeBanner(null);
  };

  const handleOpenAIAssign = (tab: 'assigner' | 'creator' | 'coach' = 'assigner') => {
    setAiAssignInitialTab(tab);
    if (!isMomMode) {
      requestParentAuth(
        () => setIsAIAssignModalOpen(true),
        'AI Smart Assigner & Creator',
        'Enter Parent PIN to run AI auto-assignment or generate chore templates.'
      );
    } else {
      setIsAIAssignModalOpen(true);
    }
  };

  const handleSaveChore = (savedChore: Chore) => {
    const index = chores.findIndex(c => c.id === savedChore.id);
    if (index >= 0) {
      const updated = [...chores];
      updated[index] = savedChore;
      setChores(updated);
      showToast(`Chore "${savedChore.title}" updated successfully.`);
    } else {
      setChores([...chores, savedChore]);
      showToast(`New chore "${savedChore.title}" added.`);
    }
  };

  const handleBatchAddChores = (newChores: (Omit<Chore, 'id'> & { id?: string })[]) => {
    const choresWithIds: Chore[] = newChores.map(c => ({
      ...c,
      id: c.id || `chore_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      isActive: c.isActive !== undefined ? c.isActive : true,
      qualityChecklist: c.qualityChecklist || [],
    }));
    setChores(prev => [...prev, ...choresWithIds]);
    soundFX.playRewardCoin();
    triggerConfettiCelebration();
    showToast(`Added ${choresWithIds.length} new chore template(s) to Library! ✨`);
  };

  const handleDeleteChore = (choreId: string) => {
    setChores(prev => prev.filter(c => c.id !== choreId));
    showToast('Chore deleted.');
  };

  const handleToggleChoreActive = (choreId: string) => {
    setChores(prev => prev.map(c => {
      if (c.id === choreId) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    }));
  };

  const handleSaveMember = (memberData: Omit<HouseholdMember, 'id' | 'currentPoints' | 'lifetimePoints' | 'starsCount' | 'streakDays'> & { id?: string }) => {
    let updatedList: HouseholdMember[];
    if (memberData.id) {
      updatedList = members.map(m => {
        if (m.id === memberData.id) {
          return {
            ...m,
            ...memberData,
          };
        }
        return m;
      });
      setMembers(updatedList);
      showToast(`Helper ${memberData.name} updated!`);
    } else {
      const newMember: HouseholdMember = {
        ...memberData,
        id: `member_${Date.now()}`,
        currentPoints: 0,
        lifetimePoints: 0,
        starsCount: 0,
        streakDays: 1,
      };
      updatedList = [...members, newMember];
      setMembers(updatedList);
      showToast(`New family helper ${memberData.name} added!`);
    }
    soundFX.playPop();

    // Instant cloud sync push for avatar photos/profile edits
    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updatedList,
      }).catch(console.warn);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    if (selectedMemberId === memberId) {
      setSelectedMemberId('all');
    }
    showToast('Family helper removed.');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updated,
      }).catch(console.warn);
    }
  };

  const handleAdjustPoints = (memberId: string, delta: number, reason: string) => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        const nextPts = Math.max(0, m.currentPoints + delta);
        return {
          ...m,
          currentPoints: nextPts,
          lifetimePoints: delta > 0 ? m.lifetimePoints + delta : m.lifetimePoints,
        };
      }
      return m;
    });
    setMembers(updated);
    soundFX.playRewardCoin();
    showToast(`Points adjusted: ${delta > 0 ? '+' : ''}${delta} pts (${reason}).`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updated,
      }).catch(console.warn);
    }
  };

  const handleClaimReward = (rewardId: string, memberId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    const member = members.find(m => m.id === memberId);
    if (!reward || !member) return;

    if (member.currentPoints < reward.pointCost) {
      showToast(`${member.name} needs ${reward.pointCost - member.currentPoints} more points for this reward.`);
      return;
    }

    const updatedMembers = members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          currentPoints: m.currentPoints - reward.pointCost,
        };
      }
      return m;
    });
    setMembers(updatedMembers);

    const newClaim: RewardClaim = {
      id: `claim_${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      memberId,
      memberName: member.name,
      pointCost: reward.pointCost,
      claimedAt: new Date().toISOString(),
      status: 'pending',
    };

    const updatedClaims = [newClaim, ...claims];
    setClaims(updatedClaims);
    soundFX.playRewardCoin();
    showToast(`Reward "${reward.title}" requested for ${member.name}! Mom will review.`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updatedMembers,
        claims: updatedClaims,
      }).catch(console.warn);
    }
  };

  const handleApproveClaim = (claimId: string, parentNote?: string) => {
    const updated = claims.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'approved' as const,
          parentNote: parentNote || c.parentNote,
          approvedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setClaims(updated);
    triggerConfettiCelebration();
    soundFX.playRewardCoin();
    showToast('Reward claim approved! 🎉 Ready to enjoy.');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        claims: updated,
      }).catch(console.warn);
    }
  };

  const handleDeliverClaim = (claimId: string, parentNote?: string) => {
    const updated = claims.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'delivered' as const,
          parentNote: parentNote || c.parentNote,
          deliveredAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setClaims(updated);
    soundFX.playFanfare();
    showToast('Reward marked as delivered & fulfilled! 🎁');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        claims: updated,
      }).catch(console.warn);
    }
  };

  const handleRejectClaim = (claimId: string, parentNote?: string) => {
    const targetClaim = claims.find(c => c.id === claimId);
    if (!targetClaim) return;

    // Refund points to member
    const updatedMembers = members.map(m => {
      if (m.id === targetClaim.memberId) {
        return {
          ...m,
          currentPoints: m.currentPoints + targetClaim.pointCost,
        };
      }
      return m;
    });
    setMembers(updatedMembers);

    const updatedClaims = claims.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'rejected' as const,
          parentNote: parentNote || c.parentNote,
          rejectedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setClaims(updatedClaims);
    soundFX.playPop();
    showToast(`Claim refunded! ${targetClaim.pointCost} points returned to ${targetClaim.memberName}.`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updatedMembers,
        claims: updatedClaims,
      }).catch(console.warn);
    }
  };

  const handleDeleteClaim = (claimId: string) => {
    const updated = claims.filter(c => c.id !== claimId);
    setClaims(updated);
    showToast('Redemption record deleted.');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        claims: updated,
      }).catch(console.warn);
    }
  };

  const handleAddNewReward = (newReward: Omit<RewardItem, 'id'>) => {
    const reward: RewardItem = {
      ...newReward,
      id: `reward_${Date.now()}`,
    };
    const updated = [...rewards, reward];
    setRewards(updated);
    showToast(`Reward "${reward.title}" added to catalog.`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        rewards: updated,
      }).catch(console.warn);
    }
  };

  const handleDeleteReward = (rewardId: string) => {
    const updated = rewards.filter(r => r.id !== rewardId);
    setRewards(updated);
    showToast('Reward deleted.');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        rewards: updated,
      }).catch(console.warn);
    }
  };

  const handleApplyAIAssignments = (newAssignments: { choreId: string; memberId: string }[]) => {
    const updatedChores = chores.map(chore => {
      const match = newAssignments.find(a => a.choreId === chore.id);
      if (match) {
        return {
          ...chore,
          assignedMemberId: match.memberId,
        };
      }
      return chore;
    });
    setChores(updatedChores);
    triggerBigCelebration();
    soundFX.playComplete();
    showToast(`AI successfully auto-assigned ${newAssignments.length} chores based on helper ages and skill levels!`);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        chores: updatedChores,
      }).catch(console.warn);
    }
  };

  const handleSaveHouseholdInfo = (newInfo: HouseholdInfo) => {
    setHouseholdInfo(newInfo);
    showToast('Household profile and photo saved successfully! 🏡');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        familyName: newInfo.familyName,
        houseAddressOrMotto: newInfo.houseAddressOrMotto,
        housePhotoUrl: newInfo.housePhotoUrl,
      }).catch(console.warn);
    }
  };

  const handleResetDemo = () => {
    resetAllToDemo();
    setHouseholdInfo(DEFAULT_HOUSEHOLD_INFO);
    setMembers(loadStoredMembers());
    setChores(loadStoredChores());
    setLogs(loadStoredLogs());
    setRewards(loadStoredRewards());
    setClaims(loadStoredClaims());
    showToast('All household chores, members, photos and demo data reset to default.');
  };

  return (
    <div className={`min-h-screen ${theme.appBgClass} flex flex-col font-sans antialiased relative overflow-x-hidden transition-colors duration-300`}>
      {/* Dynamic Ambient Background Glow Light Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-70 dark:opacity-40 no-print" aria-hidden="true">
        <div className={`absolute -top-32 -left-32 w-96 sm:w-[520px] h-96 sm:h-[520px] rounded-full ${theme.ambientGlow.orb1} blur-3xl filter transition-all duration-700 animate-pulse`} />
        <div className={`absolute top-1/3 -right-32 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full ${theme.ambientGlow.orb2} blur-3xl filter transition-all duration-700`} />
        <div className={`absolute -bottom-32 left-1/4 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full ${theme.ambientGlow.orb3} blur-3xl filter transition-all duration-700`} />
      </div>
      
      {/* Toast Banner Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        members={members}
        householdInfo={householdInfo}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        onOpenQuickSettings={() => setIsQuickSettingsOpen(true)}
        onOpenHouseSettings={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setIsHouseSettingsModalOpen(true),
              'Household Settings Security',
              'Enter Parent PIN to manage house profile, PIN settings, and family goals.'
            );
          } else {
            setIsHouseSettingsModalOpen(true);
          }
        }}
        selectedMemberId={selectedMemberId}
        onSelectMember={(id) => setSelectedMemberId(id)}
        pendingInspectionCount={pendingInspectionCount}
        onOpenNewChore={() => setChoreModalData({ isOpen: true, choreToEdit: null })}
        onOpenInspectionQueue={() => setCurrentView('inspection')}
        onOpenPrintView={() => setCurrentView('reports')}
        onOpenAIAssign={() => setIsAIAssignModalOpen(true)}
        onOpenGoogleCalendar={() => setCurrentView('calendar')}
        isMomMode={isMomMode}
        onToggleMomMode={handleToggleMomMode}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Live Nudge Alert Banner for Kids & Family */}
      {activeNudgeBanner && (
        <div className="fixed top-18 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3.5 rounded-2xl shadow-xl border border-amber-300 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-base">🔔</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-100">
                {activeNudgeBanner.senderName} says:
              </div>
              <p className="text-xs font-bold truncate">
                {activeNudgeBanner.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDismissNudge(activeNudgeBanner.id)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black shrink-0 cursor-pointer min-h-[32px]"
          >
            Got it!
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <Navigation
        currentView={currentView}
        onSelectView={(v) => {
          soundFX.playPop();
          setCurrentView(v);
        }}
        pendingInspectionCount={pendingInspectionCount}
        pendingRewardCount={pendingRewardCount}
        overdueStatusCount={evaluateHouseholdStatus(members, chores, logs, penaltySettings).behindMembers.length}
        isMomMode={isMomMode}
        language={language}
        currentTheme={currentTheme}
      />

      {/* Primary Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 sm:pb-8">
        {currentView === 'today' && (
          <DailyScheduleView
            currentDateStr={currentDateStr}
            onDateChange={(d) => setCurrentDateStr(d)}
            chores={chores}
            logs={logs}
            members={members}
            selectedMemberId={selectedMemberId}
            onSelectMember={(id) => setSelectedMemberId(id)}
            isMomMode={isMomMode}
            language={language}
            currentTheme={currentTheme}
            viewMode={dailyViewMode}
            onViewModeChange={(mode) => {
              setDailyViewMode(mode);
              saveDailyLayout(mode);
            }}
            onMarkComplete={handleMarkComplete}
            onOpenInspect={(chore, log) => handleOpenInspect(chore, log)}
            onQuickApprove={handleQuickApprove}
            onOpenNewChore={() => setChoreModalData({ isOpen: true, choreToEdit: null })}
            onBatchApproveAll={handleBatchApproveAll}
            onEditChore={(chore) => setChoreModalData({ isOpen: true, choreToEdit: chore })}
            onOpenAIAssign={() => setIsAIAssignModalOpen(true)}
            onOpenGoogleCalendar={() => setCurrentView('calendar')}
            onNavigateView={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'status' && (
          <StatusView
            members={members}
            chores={chores}
            logs={logs}
            penaltySettings={penaltySettings}
            events={events}
            nudges={nudges}
            isMomMode={isMomMode}
            currentTheme={currentTheme}
            onSendNudge={handleSendNudge}
            onWaivePenalty={handleWaivePenalty}
            onExtendDueDate={handleExtendDueDate}
            onBatchWaivePenalties={handleBatchWaivePenalties}
            onUpdatePenaltySettings={handleUpdatePenaltySettings}
            onNavigateToInspection={() => setCurrentView('inspection')}
          />
        )}

        {currentView === 'weekly' && (
          <WeeklyScheduleView
            currentDateStr={currentDateStr}
            onSelectDate={(d) => {
              setCurrentDateStr(d);
              setCurrentView('today');
            }}
            chores={chores}
            logs={logs}
            members={members}
            selectedMemberId={selectedMemberId}
            currentTheme={currentTheme}
            onSelectMember={(id) => setSelectedMemberId(id)}
            onOpenInspect={(chore, log) => handleOpenInspect(chore, log)}
            onOpenPrintView={() => setCurrentView('reports')}
          />
        )}

        {currentView === 'inspection' && (
          <InspectionQueueView
            chores={chores}
            logs={logs}
            members={members}
            language={language}
            currentTheme={currentTheme}
            onOpenInspect={(chore, log) => handleOpenInspect(chore, log)}
            onQuickApprove={handleQuickApprove}
            onBatchApproveAll={handleBatchApproveAll}
          />
        )}

        {currentView === 'library' && (
          <ChoreLibraryView
            chores={chores}
            members={members}
            currentTheme={currentTheme}
            onOpenCreateChore={() => setChoreModalData({ isOpen: true, choreToEdit: null })}
            onEditChore={(chore) => setChoreModalData({ isOpen: true, choreToEdit: chore })}
            onDeleteChore={handleDeleteChore}
            onToggleChoreActive={handleToggleChoreActive}
            onOpenAIAssign={handleOpenAIAssign}
          />
        )}

        {currentView === 'members' && (
          <FamilyMembersView
            members={members}
            chores={chores}
            householdInfo={householdInfo}
            isMomMode={isMomMode}
            currentTheme={currentTheme}
            onOpenNewMember={() => setMemberModalData({ isOpen: true, memberToEdit: null })}
            onEditMember={(member) => setMemberModalData({ isOpen: true, memberToEdit: member })}
            onDeleteMember={handleDeleteMember}
            onAdjustPoints={handleAdjustPoints}
            onOpenHouseSettings={() => setIsHouseSettingsModalOpen(true)}
          />
        )}

        {currentView === 'rewards' && (
          <RewardsView
            rewards={rewards}
            claims={claims}
            members={members}
            isMomMode={isMomMode}
            currentTheme={currentTheme}
            onClaimReward={handleClaimReward}
            onApproveClaim={handleApproveClaim}
            onDeliverClaim={handleDeliverClaim}
            onRejectClaim={handleRejectClaim}
            onAddNewReward={handleAddNewReward}
            onDeleteReward={handleDeleteReward}
            onNavigateToRedemptions={() => setCurrentView('redemptions')}
          />
        )}

        {currentView === 'redemptions' && (
          <RedemptionsManagerView
            claims={claims}
            rewards={rewards}
            members={members}
            isMomMode={isMomMode}
            currentTheme={currentTheme}
            onApproveClaim={handleApproveClaim}
            onDeliverClaim={handleDeliverClaim}
            onRejectClaim={handleRejectClaim}
            onDeleteClaim={handleDeleteClaim}
            onNavigateToRewards={() => setCurrentView('rewards')}
          />
        )}

        {currentView === 'reports' && (
          <ReportsAndPrintView
            members={members}
            chores={chores}
            logs={logs}
            householdInfo={householdInfo}
            currentDateStr={currentDateStr}
          />
        )}

        {currentView === 'calendar' && (
          <GoogleCalendarView
            chores={chores}
            members={members}
            selectedDate={currentDateStr}
          />
        )}
      </main>

      {/* House Settings & Photo Modal */}
      {isHouseSettingsModalOpen && (
        <HouseSettingsModal
          isOpen={isHouseSettingsModalOpen}
          onClose={() => setIsHouseSettingsModalOpen(false)}
          householdInfo={householdInfo}
          onSaveHouseholdInfo={handleSaveHouseholdInfo}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* AI Smart Chore Auto-Assigner Modal */}
      {isAIAssignModalOpen && (
        <AIAssignModal
          isOpen={isAIAssignModalOpen}
          onClose={() => setIsAIAssignModalOpen(false)}
          members={members}
          chores={chores}
          currentTheme={currentTheme}
          initialTab={aiAssignInitialTab}
          onApplyAssignments={handleApplyAIAssignments}
          onAddGeneratedChores={handleBatchAddChores}
        />
      )}

      {/* Mom Inspection Quality Modal */}
      {inspectModalData.isOpen && inspectModalData.chore && (
        <InspectionModal
          isOpen={inspectModalData.isOpen}
          onClose={() => setInspectModalData({ isOpen: false, chore: null, log: null })}
          chore={inspectModalData.chore}
          log={inspectModalData.log}
          assignee={members.find(m => m.id === inspectModalData.chore?.assignedMemberId) || null}
          currentTheme={currentTheme}
          onSaveGrading={handleSaveGrading}
        />
      )}

      {/* Chore Add/Edit Modal */}
      {choreModalData.isOpen && (
        <ChoreModal
          isOpen={choreModalData.isOpen}
          onClose={() => setChoreModalData({ isOpen: false, choreToEdit: null })}
          choreToEdit={choreModalData.choreToEdit}
          members={members}
          currentTheme={currentTheme}
          onSaveChore={handleSaveChore}
        />
      )}

      {/* Family Member Add/Edit Modal */}
      {memberModalData.isOpen && (
        <MemberModal
          isOpen={memberModalData.isOpen}
          onClose={() => setMemberModalData({ isOpen: false, memberToEdit: null })}
          memberToEdit={memberModalData.memberToEdit}
          currentTheme={currentTheme}
          onSaveMember={handleSaveMember}
        />
      )}

      {/* Mom / Parent PIN Security Authentication Modal */}
      {isParentPinModalOpen && (
        <ParentPinModal
          isOpen={isParentPinModalOpen}
          onClose={() => {
            setIsParentPinModalOpen(false);
            setPendingParentAuthCallback(null);
          }}
          onSuccess={() => {
            if (pendingParentAuthCallback) {
              pendingParentAuthCallback();
            }
            setPendingParentAuthCallback(null);
          }}
          actionTitle={pinModalTitle}
          actionDescription={pinModalDesc}
          currentTheme={currentTheme}
        />
      )}

      {/* Multi-Family Firebase Cloud Sync Modal */}
      <HouseholdSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        householdInfo={householdInfo}
        activeHousehold={activeHousehold}
        currentTheme={currentTheme}
        onHouseholdConnected={handleHouseholdConnected}
        onHouseholdDisconnected={handleHouseholdDisconnected}
        onShowToast={(msg) => showToast(msg)}
      />

      {/* Quick Settings & Tools Modal */}
      <QuickSettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        householdInfo={householdInfo}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        onOpenGoogleCalendar={() => setCurrentView('calendar')}
        onOpenPrintView={() => setCurrentView('reports')}
        onOpenFamilyMembers={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setCurrentView('members'),
              'Household Members Security',
              'Enter Parent PIN to manage members, avatars, and PINs.'
            );
          } else {
            setCurrentView('members');
          }
        }}
        onOpenChoreLibrary={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setCurrentView('library'),
              'Chore Library Security',
              'Enter Parent PIN to manage routine chore templates and schedules.'
            );
          } else {
            setCurrentView('library');
          }
        }}
        onOpenAIAssign={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setIsAIAssignModalOpen(true),
              'AI Smart Assigner Security',
              'Enter Parent PIN to run AI auto-assignment and chore advice.'
            );
          } else {
            setIsAIAssignModalOpen(true);
          }
        }}
        onOpenRedemptions={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setCurrentView('redemptions'),
              'Reward Redemptions Security',
              'Enter Parent PIN to review and approve helper reward claims.'
            );
          } else {
            setCurrentView('redemptions');
          }
        }}
        onOpenHouseSettings={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setIsHouseSettingsModalOpen(true),
              'Household Settings Security',
              'Enter Parent PIN to manage house profile, PIN settings, and family goals.'
            );
          } else {
            setIsHouseSettingsModalOpen(true);
          }
        }}
        onResetDemo={handleResetDemo}
        isMomMode={isMomMode}
      />
    </div>
  );
}
