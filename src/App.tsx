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
  triggerBigCelebration 
} from './utils/storage';
import { HouseholdMember, Chore, ChoreAssignmentLog, RewardItem, RewardClaim, ViewMode, HouseholdInfo } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DailyScheduleView } from './components/DailyScheduleView';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { InspectionQueueView } from './components/InspectionQueueView';
import { ChoreLibraryView } from './components/ChoreLibraryView';
import { FamilyMembersView } from './components/FamilyMembersView';
import { RewardsView } from './components/RewardsView';
import { ReportsAndPrintView } from './components/ReportsAndPrintView';
import { InspectionModal } from './components/InspectionModal';
import { ChoreModal } from './components/ChoreModal';
import { MemberModal } from './components/MemberModal';
import { HouseSettingsModal } from './components/HouseSettingsModal';
import { AIAssignModal } from './components/AIAssignModal';
import { GoogleCalendarView } from './components/GoogleCalendarView';
import { ParentPinModal } from './components/ParentPinModal';
import { HouseholdSyncModal } from './components/HouseholdSyncModal';
import { soundFX } from './utils/audio';
import { SupportedLanguage, getTranslation } from './utils/i18n';
import { ThemePreset, THEMES } from './utils/theme';
import { isPinProtectionEnabled, isParentSessionUnlocked, setParentSessionUnlocked } from './utils/parentLock';
import { 
  CloudHousehold, 
  getCurrentHouseholdId, 
  getHousehold, 
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

  // Cloud multi-tenant household state
  const [activeHousehold, setActiveHousehold] = useState<CloudHousehold | null>(null);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);

  // Deduplication ref to prevent bouncing echoes between devices
  const lastSyncedHashRef = useRef<string>('');
  const isReceivingRemoteUpdateRef = useRef<boolean>(false);

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
  const [isHouseSettingsModalOpen, setIsHouseSettingsModalOpen] = useState<boolean>(false);

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

  // Auto-connect via Invite Link / URL parameter (?join=CODE or ?code=CODE or ?hh=ID)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('join') || urlParams.get('code') || urlParams.get('hh') || urlParams.get('household');
      if (inviteCode) {
        findHouseholdByCode(inviteCode).then((hh) => {
          if (hh) {
            setCurrentHouseholdId(hh.id);
            setActiveHousehold(hh);
            if (hh.members && hh.members.length > 0) setMembers(hh.members);
            if (hh.chores && hh.chores.length > 0) setChores(hh.chores);
            if (hh.logs) setLogs(hh.logs);
            if (hh.rewards && hh.rewards.length > 0) setRewards(hh.rewards);
            if (hh.claims) setClaims(hh.claims);
            setHouseholdInfo(prev => ({
              ...prev,
              familyName: hh.familyName || prev.familyName,
              houseAddressOrMotto: hh.houseAddressOrMotto || prev.houseAddressOrMotto,
              housePhotoUrl: hh.housePhotoUrl || prev.housePhotoUrl,
              householdCode: hh.householdCode,
              householdId: hh.id,
              isCloudSynced: true,
            }));
            soundFX.playFanfare();
            showToast(`Connected to "${hh.familyName}" via invite link! 🎉`);
            // Clean URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }).catch(console.warn);
      }
    } catch (e) {
      console.warn('URL invite check notice:', e);
    }
  }, []);

  // Debounced cloud sync to prevent quota exhaustion and duplicate sync echoes
  useEffect(() => {
    if (!activeHousehold?.id) return;
    if (isReceivingRemoteUpdateRef.current) return;

    const dataPayload = {
      familyName: householdInfo.familyName,
      houseAddressOrMotto: householdInfo.houseAddressOrMotto,
      housePhotoUrl: householdInfo.housePhotoUrl,
      householdCode: activeHousehold.householdCode,
      members,
      chores,
      logs,
      rewards,
      claims,
    };

    const currentHash = JSON.stringify(dataPayload);
    if (currentHash === lastSyncedHashRef.current) return;

    const timer = setTimeout(() => {
      lastSyncedHashRef.current = currentHash;
      syncCompleteHouseholdToCloud(activeHousehold.id, dataPayload).catch(console.warn);
    }, 800);

    return () => clearTimeout(timer);
  }, [members, chores, logs, rewards, claims, householdInfo, activeHousehold?.id]);

  // Real-time Cloud Sync Subscription (Dual Firestore + Fast Polling Engine)
  useEffect(() => {
    const savedHhId = getCurrentHouseholdId();
    if (!savedHhId) return;

    let isMounted = true;

    // 1. Fetch initial household record
    getHousehold(savedHhId).then((hh) => {
      if (hh && isMounted) {
        setActiveHousehold(hh);
        if (hh.members && hh.members.length > 0) setMembers(hh.members);
        if (hh.chores && hh.chores.length > 0) setChores(hh.chores);
        if (hh.logs) setLogs(hh.logs);
        if (hh.rewards && hh.rewards.length > 0) setRewards(hh.rewards);
        if (hh.claims) setClaims(hh.claims);

        setHouseholdInfo(prev => ({
          ...prev,
          familyName: hh.familyName || prev.familyName,
          houseAddressOrMotto: hh.houseAddressOrMotto || prev.houseAddressOrMotto,
          housePhotoUrl: hh.housePhotoUrl || prev.housePhotoUrl,
          householdCode: hh.householdCode,
          householdId: hh.id,
          isCloudSynced: true,
        }));
      }
    }).catch(console.warn);

    // 2. Real-time multi-device subscription
    const unsubscribe = subscribeHouseholdFull(savedHhId, (cloudHh) => {
      if (!isMounted) return;
      isReceivingRemoteUpdateRef.current = true;

      setActiveHousehold(cloudHh);
      if (cloudHh.members && cloudHh.members.length > 0) setMembers(cloudHh.members);
      if (cloudHh.chores && cloudHh.chores.length > 0) setChores(cloudHh.chores);
      if (cloudHh.logs) setLogs(cloudHh.logs);
      if (cloudHh.rewards && cloudHh.rewards.length > 0) setRewards(cloudHh.rewards);
      if (cloudHh.claims) setClaims(cloudHh.claims);

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
        members: cloudHh.members,
        chores: cloudHh.chores,
        logs: cloudHh.logs,
        rewards: cloudHh.rewards,
        claims: cloudHh.claims,
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
    setActiveHousehold(household);
    if (household.members && household.members.length > 0) setMembers(household.members);
    if (household.chores && household.chores.length > 0) setChores(household.chores);
    if (household.logs && household.logs.length > 0) setLogs(household.logs);
    if (household.rewards && household.rewards.length > 0) setRewards(household.rewards);
    if (household.claims && household.claims.length > 0) setClaims(household.claims);

    setHouseholdInfo(prev => ({
      ...prev,
      familyName: household.familyName,
      houseAddressOrMotto: household.houseAddressOrMotto,
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
    const basePoints = chore.defaultPoints;
    const totalPoints = isRedo ? 0 : basePoints + bonusPoints;
    const newStatus = isRedo ? 'needs_redo' : 'approved';

    if (log) {
      setLogs(prev => prev.map(l => {
        if (l.id === log.id) {
          return {
            ...l,
            status: newStatus,
            qualityScore: score,
            qualityGrade: grade,
            pointsAwarded: isRedo ? 0 : basePoints,
            bonusPoints: isRedo ? 0 : bonusPoints,
            feedbackNote,
            checklistStatus,
            reviewedAt: new Date().toISOString(),
          };
        }
        return l;
      }));
    } else {
      const newLog: ChoreAssignmentLog = {
        id: logId,
        choreId: chore.id,
        memberId: chore.assignedMemberId || 'unassigned',
        date: currentDateStr,
        status: newStatus,
        completedAt: new Date().toISOString(),
        qualityScore: score,
        qualityGrade: grade,
        pointsAwarded: isRedo ? 0 : basePoints,
        bonusPoints: isRedo ? 0 : bonusPoints,
        feedbackNote,
        checklistStatus,
        reviewedAt: new Date().toISOString(),
      };
      setLogs(prev => [...prev, newLog]);
    }

    if (!isRedo && totalPoints > 0) {
      setMembers(prev => prev.map(m => {
        if (m.id === chore.assignedMemberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + totalPoints,
            lifetimePoints: m.lifetimePoints + totalPoints,
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
      showToast(`Approved! Awarded ${grade} (${score}⭐) and ${totalPoints} points.`);
    } else {
      soundFX.playPop();
      showToast(`Chore marked for Redo. Feedback left for helper.`);
    }

    setInspectModalData({ isOpen: false, chore: null, log: null });
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
    if (memberData.id) {
      setMembers(prev => prev.map(m => {
        if (m.id === memberData.id) {
          return {
            ...m,
            ...memberData,
          };
        }
        return m;
      }));
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
      setMembers(prev => [...prev, newMember]);
      showToast(`New family helper ${memberData.name} added!`);
    }
    soundFX.playPop();
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    if (selectedMemberId === memberId) {
      setSelectedMemberId('all');
    }
    showToast('Family helper removed.');
  };

  const handleAdjustPoints = (memberId: string, delta: number, reason: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updated = Math.max(0, m.currentPoints + delta);
        return {
          ...m,
          currentPoints: updated,
          lifetimePoints: delta > 0 ? m.lifetimePoints + delta : m.lifetimePoints,
        };
      }
      return m;
    }));
    soundFX.playRewardCoin();
    showToast(`Points adjusted: ${delta > 0 ? '+' : ''}${delta} pts (${reason}).`);
  };

  const handleClaimReward = (rewardId: string, memberId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    const member = members.find(m => m.id === memberId);
    if (!reward || !member) return;

    if (member.currentPoints < reward.pointCost) {
      showToast(`${member.name} needs ${reward.pointCost - member.currentPoints} more points for this reward.`);
      return;
    }

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          currentPoints: m.currentPoints - reward.pointCost,
        };
      }
      return m;
    }));

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

    setClaims(prev => [newClaim, ...prev]);
    soundFX.playRewardCoin();
    showToast(`Reward "${reward.title}" requested for ${member.name}! Mom will review.`);
  };

  const handleApproveClaim = (claimId: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'approved',
        };
      }
      return c;
    }));
    triggerConfettiCelebration();
    soundFX.playRewardCoin();
    showToast('Reward claim approved!');
  };

  const handleDeliverClaim = (claimId: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'delivered',
        };
      }
      return c;
    }));
    soundFX.playRewardCoin();
    showToast('Reward marked as delivered to helper!');
  };

  const handleAddNewReward = (newReward: Omit<RewardItem, 'id'>) => {
    const reward: RewardItem = {
      ...newReward,
      id: `reward_${Date.now()}`,
    };
    setRewards(prev => [...prev, reward]);
    showToast(`Reward "${reward.title}" added to catalog.`);
  };

  const handleDeleteReward = (rewardId: string) => {
    setRewards(prev => prev.filter(r => r.id !== rewardId));
    showToast('Reward deleted.');
  };

  const handleApplyAIAssignments = (newAssignments: { choreId: string; memberId: string }[]) => {
    setChores(prev => prev.map(chore => {
      const match = newAssignments.find(a => a.choreId === chore.id);
      if (match) {
        return {
          ...chore,
          assignedMemberId: match.memberId,
        };
      }
      return chore;
    }));
    triggerBigCelebration();
    soundFX.playComplete();
    showToast(`AI successfully auto-assigned ${newAssignments.length} chores based on helper ages and skill levels!`);
  };

  const handleSaveHouseholdInfo = (newInfo: HouseholdInfo) => {
    setHouseholdInfo(newInfo);
    showToast('Household profile and photo saved successfully! 🏡');
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
        onResetDemo={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => handleResetDemo(),
              'Reset Demo Data Security',
              'Enter Parent PIN to reset all chore schedules, members, and logs.'
            );
          } else {
            handleResetDemo();
          }
        }}
        isMomMode={isMomMode}
        onToggleMomMode={handleToggleMomMode}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Navigation Tabs Bar */}
      <Navigation
        currentView={currentView}
        onSelectView={(v) => {
          soundFX.playPop();
          setCurrentView(v);
        }}
        pendingInspectionCount={pendingInspectionCount}
        pendingRewardCount={pendingRewardCount}
        isMomMode={isMomMode}
        language={language}
        currentTheme={currentTheme}
      />

      {/* Primary Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {currentView === 'today' && (
          <DailyScheduleView
            currentDateStr={currentDateStr}
            onDateChange={(d) => setCurrentDateStr(d)}
            chores={chores}
            logs={logs}
            members={members}
            selectedMemberId={selectedMemberId}
            isMomMode={isMomMode}
            language={language}
            currentTheme={currentTheme}
            onMarkComplete={handleMarkComplete}
            onOpenInspect={(chore, log) => handleOpenInspect(chore, log)}
            onQuickApprove={handleQuickApprove}
            onOpenNewChore={() => setChoreModalData({ isOpen: true, choreToEdit: null })}
            onBatchApproveAll={handleBatchApproveAll}
            onEditChore={(chore) => setChoreModalData({ isOpen: true, choreToEdit: chore })}
            onOpenAIAssign={() => setIsAIAssignModalOpen(true)}
            onOpenGoogleCalendar={() => setCurrentView('calendar')}
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
            onOpenInspect={(chore, log) => handleOpenInspect(chore, log)}
            onQuickApprove={handleQuickApprove}
            onBatchApproveAll={handleBatchApproveAll}
          />
        )}

        {currentView === 'library' && (
          <ChoreLibraryView
            chores={chores}
            members={members}
            onOpenNewChore={() => setChoreModalData({ isOpen: true, choreToEdit: null })}
            onEditChore={(chore) => setChoreModalData({ isOpen: true, choreToEdit: chore })}
            onDeleteChore={handleDeleteChore}
            onToggleChoreActive={handleToggleChoreActive}
            onOpenAIAssign={() => setIsAIAssignModalOpen(true)}
          />
        )}

        {currentView === 'members' && (
          <FamilyMembersView
            members={members}
            chores={chores}
            householdInfo={householdInfo}
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
            onClaimReward={handleClaimReward}
            onApproveClaim={handleApproveClaim}
            onDeliverClaim={handleDeliverClaim}
            onAddNewReward={handleAddNewReward}
            onDeleteReward={handleDeleteReward}
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
        />
      )}

      {/* AI Smart Chore Auto-Assigner Modal */}
      {isAIAssignModalOpen && (
        <AIAssignModal
          isOpen={isAIAssignModalOpen}
          onClose={() => setIsAIAssignModalOpen(false)}
          members={members}
          chores={chores}
          onApplyAssignments={handleApplyAIAssignments}
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
          onSaveChore={handleSaveChore}
        />
      )}

      {/* Family Member Add/Edit Modal */}
      {memberModalData.isOpen && (
        <MemberModal
          isOpen={memberModalData.isOpen}
          onClose={() => setMemberModalData({ isOpen: false, memberToEdit: null })}
          memberToEdit={memberModalData.memberToEdit}
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
    </div>
  );
}
