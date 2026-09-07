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
  DEFAULT_PENALTY_SETTINGS,
  mergeRewardsWithDefaults,
  getChoreAssigneeForDate,
  sanitizeLogs
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
import { ProgressionJourneyModal } from './components/ProgressionJourneyModal';
import { PointManagerModal } from './components/PointManagerModal';
import { CosmeticsManagerModal } from './components/CosmeticsManagerModal';
import { HouseEvolutionModal } from './components/HouseEvolutionModal';
import { calculateHouseProgression } from './utils/houseProgression';
import { BadgeStyle } from './components/CategoryBadge';
import { GlassIceShaderBackground } from './components/GlassIceShaderBackground';
import { soundFX } from './utils/audio';
import { SupportedLanguage, getTranslation } from './utils/i18n';
import { ThemePreset, THEMES, isGlassTheme } from './utils/theme';
import { INITIAL_REWARDS } from './data/initialData';
import { evaluateHouseholdStatus, calculateInspectionAward, calculateDaysLate, getISOWeekNumber } from './utils/penaltyEngine';
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

    const [forceMobileUi, setForceMobileUi] = useState<boolean>(() => {
    try {
      return localStorage.getItem('family_chore_force_mobile') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMobileUi = () => {
    setForceMobileUi(prev => {
      const next = !prev;
      try {
        localStorage.setItem('family_chore_force_mobile', String(next));
      } catch {}
      return next;
    });
  };

const [currentTheme, setCurrentTheme] = useState<ThemePreset>(() => {
    try {
      return (localStorage.getItem('family_chore_theme') as ThemePreset) || 'rose';
    } catch {
      return 'rose';
    }
  });

  const theme = THEMES[currentTheme] || THEMES.rose;

  // Sync document.documentElement 'dark' class and data-theme with active theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const themeAttribute = currentTheme === 'frosted_glass' ? 'glass'
        : currentTheme === 'crystal_ice' ? 'ice'
        : currentTheme;
      document.documentElement.setAttribute('data-theme', themeAttribute);
    }
  }, [theme.isDark, currentTheme]);

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

  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>(() => {
    try {
      return (localStorage.getItem('family_chore_badge_style') as BadgeStyle) || 'original';
    } catch {
      return 'original';
    }
  });

  const handleSelectBadgeStyle = (style: BadgeStyle) => {
    setBadgeStyle(style);
    try {
      localStorage.setItem('family_chore_badge_style', style);
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

  const [progressionModalData, setProgressionModalData] = useState<{
    isOpen: boolean;
    selectedMemberId: string;
  }>({
    isOpen: false,
    selectedMemberId: '',
  });

  const [pointManagerModalData, setPointManagerModalData] = useState<{
    isOpen: boolean;
    initialMemberId?: string;
  }>({
    isOpen: false,
    initialMemberId: undefined,
  });

  const [cosmeticsModalData, setCosmeticsModalData] = useState<{
    isOpen: boolean;
    initialMemberId?: string;
  }>({
    isOpen: false,
    initialMemberId: undefined,
  });

  const [isHouseEvolutionOpen, setIsHouseEvolutionOpen] = useState<boolean>(false);
  const [highlightMemberIdForHouse, setHighlightMemberIdForHouse] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dailyViewMode, setDailyViewMode] = useState<'list' | 'grid'>(() => loadStoredDailyLayout());

  // Automatic House Level Up detection: when members level up and house levels up automatically
  const houseProg = calculateHouseProgression(members, householdInfo);
  const prevHouseLevelRef = useRef<number>(houseProg.currentLevel.level);

  useEffect(() => {
    if (houseProg.currentLevel.level > prevHouseLevelRef.current) {
      soundFX.playFanfare();
      triggerBigCelebration();
      showToast(`🏰 EPIC HOUSE LEVEL UP! Our home is now Level ${houseProg.currentLevel.level}: ${houseProg.currentLevel.title}! 🎉`);
      setIsHouseEvolutionOpen(true);
    }
    prevHouseLevelRef.current = houseProg.currentLevel.level;
  }, [houseProg.currentLevel.level, houseProg.currentLevel.title]);

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
          if (targetHh.chores && targetHh.chores.length > 0) {
            setChores(targetHh.chores);
            saveChores(targetHh.chores);
          }
          if (targetHh.logs) {
            const cleanedLogs = sanitizeLogs(targetHh.logs);
            setLogs(cleanedLogs);
            saveLogs(cleanedLogs);
          }
          const upgradedRewards = mergeRewardsWithDefaults(targetHh.rewards || []);
          setRewards(upgradedRewards);
          saveRewards(upgradedRewards);
          if (targetHh.rewards && JSON.stringify(upgradedRewards) !== JSON.stringify(targetHh.rewards)) {
            syncCompleteHouseholdToCloud(targetHh.id, { rewards: upgradedRewards }).catch(console.warn);
          }
          if (targetHh.claims) setClaims(targetHh.claims);
          if (targetHh.penaltySettings) setPenaltySettings(targetHh.penaltySettings);
          if (targetHh.events) setEvents(targetHh.events);
          if (targetHh.nudges) setNudges(targetHh.nudges);

          setHouseholdInfo(prev => {
            const next = {
              ...prev,
              familyName: targetHh!.familyName || prev.familyName,
              houseAddressOrMotto: targetHh!.houseAddressOrMotto || prev.houseAddressOrMotto,
              housePhotoUrl: targetHh!.housePhotoUrl || prev.housePhotoUrl,
              householdCode: targetHh!.householdCode,
              householdId: targetHh!.id,
              customHouseXp: targetHh!.customHouseXp !== undefined ? targetHh!.customHouseXp : prev.customHouseXp,
              isCloudSynced: true,
            };
            saveHouseholdInfo(next);
            return next;
          });

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
            rewards: upgradedRewards,
            claims: targetHh.claims || claims,
            penaltySettings: targetHh.penaltySettings || penaltySettings,
            events: targetHh.events || events,
            nudges: targetHh.nudges || nudges,
            customHouseXp: targetHh.customHouseXp,
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
      customHouseXp: householdInfo.customHouseXp,
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
      if (cloudHh.chores && cloudHh.chores.length > 0) {
        setChores(cloudHh.chores);
        saveChores(cloudHh.chores);
      }
      if (cloudHh.logs) {
        const cleanedLogs = sanitizeLogs(cloudHh.logs);
        setLogs(cleanedLogs);
        saveLogs(cleanedLogs);
      }
      let activeRewardsList = rewards;
      if (cloudHh.rewards && cloudHh.rewards.length > 0) {
        const mergedRewards = mergeRewardsWithDefaults(cloudHh.rewards);
        activeRewardsList = mergedRewards;
        setRewards(mergedRewards);
        saveRewards(mergedRewards);
        if (JSON.stringify(mergedRewards) !== JSON.stringify(cloudHh.rewards) && targetHhId) {
          syncCompleteHouseholdToCloud(targetHhId, { rewards: mergedRewards }).catch(console.warn);
        }
      }
      if (cloudHh.claims) setClaims(cloudHh.claims);
      if (cloudHh.penaltySettings) setPenaltySettings(cloudHh.penaltySettings);
      if (cloudHh.events) setEvents(cloudHh.events);
      if (cloudHh.nudges) setNudges(cloudHh.nudges);

      setHouseholdInfo(prev => {
        const next = {
          ...prev,
          familyName: cloudHh.familyName || prev.familyName,
          houseAddressOrMotto: cloudHh.houseAddressOrMotto || prev.houseAddressOrMotto,
          housePhotoUrl: cloudHh.housePhotoUrl || prev.housePhotoUrl,
          householdCode: cloudHh.householdCode,
          householdId: cloudHh.id,
          customHouseXp: cloudHh.customHouseXp !== undefined ? cloudHh.customHouseXp : prev.customHouseXp,
          isCloudSynced: true,
        };
        saveHouseholdInfo(next);
        return next;
      });

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
        rewards: activeRewardsList,
        claims: cloudHh.claims,
        penaltySettings: cloudHh.penaltySettings,
        events: cloudHh.events,
        nudges: cloudHh.nudges,
        customHouseXp: cloudHh.customHouseXp,
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
  const handleUndoApprove = (choreId: string, logId?: string) => {
    const targetLog = logs.find(l => l.id === logId) || logs.find(l => l.choreId === choreId && l.date === currentDateStr);
    if (!targetLog) return;
    const pointsDeducted = (targetLog.pointsAwarded || 0) + (targetLog.bonusPoints || 0);

    const updatedLogs = logs.map(l => {
      if (l.id === targetLog.id) {
        return {
          ...l,
          status: 'pending' as const,
          completedAt: undefined,
          reviewedAt: undefined,
          qualityScore: undefined,
          pointsAwarded: undefined,
          bonusPoints: undefined,
        };
      }
      return l;
    });

    const updatedMembers = members.map(m => {
      if (m.id === targetLog.memberId) {
        return {
          ...m,
          currentPoints: Math.max(0, m.currentPoints - pointsDeducted),
          lifetimePoints: Math.max(0, m.lifetimePoints - pointsDeducted),
          starsCount: Math.max(0, (m.starsCount || 1) - 1),
        };
      }
      return m;
    });

    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);
    showToast('Chore reset to pending');

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      logs: updatedLogs,
      members: updatedMembers,
    }).catch(console.warn);
  };

  const handleMarkComplete = (
    choreId: string, 
    notes?: string, 
    checklist?: { [key: number]: boolean },
    targetDate?: string,
    targetMemberId?: string
  ) => {
    const effectiveDate = targetDate || currentDateStr;
    const existingIndex = logs.findIndex(l => 
      l.choreId === choreId && 
      l.date === effectiveDate && 
      (!targetMemberId || l.memberId === targetMemberId)
    );
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    // If already approved, clicking uncompletes/reopens
    if (existingIndex >= 0 && logs[existingIndex].status === 'approved') {
      handleUndoApprove(choreId, logs[existingIndex].id);
      return;
    }

    soundFX.playComplete();

    const effectiveAssigneeId = targetMemberId ||
      getChoreAssigneeForDate(chore, effectiveDate) || 
      (chore.assignedMemberId && chore.assignedMemberId !== 'unassigned' ? chore.assignedMemberId : undefined) || 
      members.find(m => m.role !== 'parent')?.id || 
      members[0]?.id || 
      'unassigned';

    let updatedLogs: ChoreAssignmentLog[];

    if (existingIndex >= 0) {
      updatedLogs = [...logs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        memberId: effectiveAssigneeId,
        status: 'needs_review',
        completedAt: new Date().toISOString(),
        completedNote: notes || updatedLogs[existingIndex].completedNote,
        checklistStatus: checklist || updatedLogs[existingIndex].checklistStatus,
      };
      showToast('Chore marked done! Ready for Mom to inspect ✨');
    } else {
      const newLog: ChoreAssignmentLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        choreId,
        memberId: effectiveAssigneeId,
        date: effectiveDate,
        status: 'needs_review',
        completedAt: new Date().toISOString(),
        completedNote: notes,
        checklistStatus: checklist,
      };
      updatedLogs = [...logs, newLog];
      showToast('Chore marked done! Ready for Mom to inspect ✨');
    }

    setLogs(updatedLogs);
    saveLogs(updatedLogs);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      logs: updatedLogs,
    }).catch(console.warn);
  };

  const handleQuickApprove = (choreId: string, logId?: string, choreDate?: string, targetMemberId?: string) => {
    const effectiveDate = choreDate || currentDateStr;
    const chore = chores.find(c => c.id === choreId);
    const targetLog = (logId ? logs.find(l => l.id === logId) : null) || 
      logs.find(l => l.choreId === choreId && l.date === effectiveDate && (!targetMemberId || l.memberId === targetMemberId));
    const pointsToAward = chore ? chore.defaultPoints : 10;
    const effectiveMemberId = targetMemberId || targetLog?.memberId || (chore ? getChoreAssigneeForDate(chore, effectiveDate) : undefined) || chore?.assignedMemberId || 'unassigned';

    let updatedLogs: ChoreAssignmentLog[];
    let updatedMembers = members;

    if (targetLog) {
      updatedLogs = logs.map(l => {
        if (l.id === targetLog.id) {
          return {
            ...l,
            memberId: effectiveMemberId,
            status: 'approved' as const,
            qualityScore: 5,
            pointsAwarded: pointsToAward,
            bonusPoints: 0,
            reviewedAt: new Date().toISOString(),
          };
        }
        return l;
      });

      updatedMembers = members.map(m => {
        if (m.id === effectiveMemberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + pointsToAward,
            lifetimePoints: m.lifetimePoints + pointsToAward,
            starsCount: m.starsCount + 1,
          };
        }
        return m;
      });
    } else if (chore) {
      const newLog: ChoreAssignmentLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        choreId: chore.id,
        memberId: effectiveMemberId,
        date: effectiveDate,
        status: 'approved',
        completedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        qualityScore: 5,
        pointsAwarded: pointsToAward,
      };
      updatedLogs = [...logs, newLog];

      updatedMembers = members.map(m => {
        if (m.id === effectiveMemberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + pointsToAward,
            lifetimePoints: m.lifetimePoints + pointsToAward,
            starsCount: m.starsCount + 1,
          };
        }
        return m;
      });
    } else {
      return;
    }

    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      logs: updatedLogs,
      members: updatedMembers,
    }).catch(console.warn);

    triggerConfettiCelebration();
    soundFX.playRewardCoin();
    showToast(`Approved! Awarded 5 Stars & ${pointsToAward} pts.`);
  };

  const handleBatchApproveOverdue = (items: { choreId: string; logId?: string; memberId: string; date: string; title?: string }[]) => {
    if (!items || items.length === 0) return;
    let pointsAwardedMap: Record<string, number> = {};
    const existingLogIdsToApprove = new Set<string>();
    const itemsToCreate: ChoreAssignmentLog[] = [];

    items.forEach(item => {
      const targetLog = item.logId 
        ? logs.find(l => l.id === item.logId)
        : logs.find(l => l.choreId === item.choreId && l.date === item.date && l.memberId === item.memberId);
      const chore = chores.find(c => c.id === item.choreId);
      const pts = chore ? chore.defaultPoints : 10;
      pointsAwardedMap[item.memberId] = (pointsAwardedMap[item.memberId] || 0) + pts;

      if (targetLog) {
        existingLogIdsToApprove.add(targetLog.id);
      } else if (chore) {
        itemsToCreate.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          choreId: chore.id,
          memberId: item.memberId,
          date: item.date,
          status: 'approved',
          completedAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          qualityScore: 5,
          pointsAwarded: pts,
        });
      }
    });

    const updatedLogs = [
      ...logs.map(l => {
        if (existingLogIdsToApprove.has(l.id)) {
          const chore = chores.find(c => c.id === l.choreId);
          const pts = chore ? chore.defaultPoints : 10;
          return {
            ...l,
            status: 'approved' as const,
            qualityScore: 5,
            pointsAwarded: pts,
            reviewedAt: new Date().toISOString(),
          };
        }
        return l;
      }),
      ...itemsToCreate,
    ];

    const updatedMembers = members.map(m => {
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
    });

    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      logs: updatedLogs,
      members: updatedMembers,
    }).catch(console.warn);

    triggerBigCelebration();
    soundFX.playRewardCoin();
    showToast(`Approved ${items.length} overdue chore${items.length > 1 ? 's' : ''}! Awarded 5 Stars ✨`);
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

    const updatedMembers = members.map(m => {
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
    });

    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      logs: updatedLogs,
      members: updatedMembers,
    }).catch(console.warn);

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
    const choreDate = log?.date || log?.originalDueDate || currentDateStr;
    const daysLate = calculateDaysLate(choreDate, log?.extendedDueDate, chore.scheduledTime, penaltySettings.shipDate);
    
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

    let updatedLogs: ChoreAssignmentLog[];
    if (log) {
      updatedLogs = logs.map(l => {
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
      });
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
      updatedLogs = [...logs, newLog];
    }
    setLogs(updatedLogs);
    saveLogs(updatedLogs);

    let updatedMembers = members;
    if (!isRedo && finalPointsAwarded > 0) {
      updatedMembers = members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            currentPoints: m.currentPoints + finalPointsAwarded,
            lifetimePoints: m.lifetimePoints + finalPointsAwarded,
            starsCount: score === 5 ? m.starsCount + 1 : m.starsCount,
          };
        }
        return m;
      });
      setMembers(updatedMembers);
      saveMembers(updatedMembers);

      if (score === 5) {
        triggerBigCelebration();
      } else {
        triggerConfettiCelebration();
      }
      soundFX.playRewardCoin();
      showToast(`Approved! Awarded ${grade} (${score}⭐) and ${finalPointsAwarded} points.`);
    } else if (isRedo) {
      soundFX.playPop();
      // If the log was previously approved with points, safely reverse them
      const prevPoints = (log?.pointsAwarded || 0) + (log?.bonusPoints || 0);
      if (prevPoints > 0) {
        updatedMembers = members.map(m => {
          if (m.id === memberId) {
            return {
              ...m,
              currentPoints: Math.max(0, m.currentPoints - prevPoints),
              lifetimePoints: Math.max(0, m.lifetimePoints - prevPoints),
            };
          }
          return m;
        });
        setMembers(updatedMembers);
        saveMembers(updatedMembers);
      }

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
        weekNumber: getISOWeekNumber(new Date()),
        year: new Date().getFullYear(),
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
      const updatedEvents = [redoEvent, ...events];
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      showToast(`Chore marked for Redo. Feedback left for helper.`);

      const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
      syncCompleteHouseholdToCloud(targetHhId, {
        logs: updatedLogs,
        members: updatedMembers,
        events: updatedEvents,
      }).catch(console.warn);
    } else {
      soundFX.playPop();
      showToast(`Approved! ${finalPointsAwarded} points awarded.`);

      const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
      syncCompleteHouseholdToCloud(targetHhId, {
        logs: updatedLogs,
        members: updatedMembers,
        events: events,
      }).catch(console.warn);
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
      timestamp: now,
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
    };

    const updatedNudges = [newNudge, ...nudges];
    const updatedEvents = [newEvent, ...events];
    setNudges(updatedNudges);
    saveNudges(updatedNudges);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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
      timestamp: now,
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
    };

    const updatedEvents = [newEvent, ...events];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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
      timestamp: now,
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
    };

    const updatedEvents = [newEvent, ...events];
    setLogs(finalLogs);
    saveLogs(finalLogs);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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
      timestamp: now,
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
    };

    const updatedEvents = [newEvent, ...events];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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
    let updated: Chore[];
    if (index >= 0) {
      updated = [...chores];
      updated[index] = savedChore;
      setChores(updated);
      saveChores(updated);
      showToast(`Chore "${savedChore.title}" updated successfully.`);
    } else {
      updated = [...chores, savedChore];
      setChores(updated);
      saveChores(updated);
      showToast(`New chore "${savedChore.title}" added.`);
    }

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      chores: updated,
      logs,
    }).catch(console.warn);
  };

  const handleBatchAddChores = (newChores: (Omit<Chore, 'id'> & { id?: string })[]) => {
    const choresWithIds: Chore[] = newChores.map(c => ({
      ...c,
      id: c.id || `chore_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      isActive: c.isActive !== undefined ? c.isActive : true,
      qualityChecklist: c.qualityChecklist || [],
    }));
    const updated = [...chores, ...choresWithIds];
    setChores(updated);
    saveChores(updated);
    soundFX.playRewardCoin();
    triggerConfettiCelebration();
    showToast(`Added ${choresWithIds.length} new chore template(s) to Library! ✨`);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      chores: updated,
      logs,
    }).catch(console.warn);
  };

  const handleDeleteChore = (choreId: string) => {
    const updated = chores.filter(c => c.id !== choreId);
    setChores(updated);
    saveChores(updated);
    showToast('Chore deleted.');

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      chores: updated,
      logs,
    }).catch(console.warn);
  };

  const handleToggleChoreActive = (choreId: string) => {
    const updated = chores.map(c => {
      if (c.id === choreId) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    });
    setChores(updated);
    saveChores(updated);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      chores: updated,
      logs,
    }).catch(console.warn);
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
    saveMembers(updated);
    soundFX.playRewardCoin();
    showToast(`Points adjusted: ${delta > 0 ? '+' : ''}${delta} pts (${reason}).`);

    // Record audit event
    const member = members.find(m => m.id === memberId);
    const beforePoints = member?.currentPoints || 0;
    const afterPoints = Math.max(0, beforePoints + delta);
    const realDelta = afterPoints - beforePoints;

    const newEvent: ChoreEvent = {
      id: `evt_pt_adj_${Date.now()}`,
      householdId: activeHousehold?.id || 'default',
      type: 'point_adjustment',
      memberId,
      memberName: member?.name || 'Helper',
      pointsBefore: beforePoints,
      pointsAfter: afterPoints,
      pointsDelta: realDelta,
      reason: reason || (delta > 0 ? `Point bonus (+${delta} pts)` : `Point deduction (${delta} pts)`),
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updated,
        events: updatedEvents,
      }).catch(console.warn);
    }
  };

  const handleSetMemberPoints = (memberId: string, newCurrentPoints: number, newLifetimePoints?: number, reason?: string) => {
    const member = members.find(m => m.id === memberId);
    const beforePoints = member?.currentPoints || 0;
    const safeTargetPoints = Math.max(0, newCurrentPoints);
    const delta = safeTargetPoints - beforePoints;

    const updated = members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          currentPoints: safeTargetPoints,
          lifetimePoints: newLifetimePoints !== undefined ? Math.max(0, newLifetimePoints) : Math.max(m.lifetimePoints, safeTargetPoints),
        };
      }
      return m;
    });
    setMembers(updated);
    saveMembers(updated);
    soundFX.playRewardCoin();
    showToast(`Points updated (${reason || 'Point adjustment'}).`);

    // Record audit event - always record even if setting to 0 or same value
    const newEvent: ChoreEvent = {
      id: `evt_pt_set_${Date.now()}`,
      householdId: activeHousehold?.id || 'default',
      type: 'point_adjustment',
      memberId,
      memberName: member?.name || 'Helper',
      pointsBefore: beforePoints,
      pointsAfter: safeTargetPoints,
      pointsDelta: delta,
      reason: reason || (safeTargetPoints === 0 ? 'Reset balance to 0 pts' : `Manual balance set to ${safeTargetPoints} pts`),
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      members: updated,
      events: updatedEvents,
    }).catch(console.warn);
  };

  const handleResetAllSeedPoints = () => {
    const updated = members.map(m => ({
      ...m,
      currentPoints: 0,
      lifetimePoints: 0,
    }));
    setMembers(updated);
    saveMembers(updated);
    soundFX.playPop();
    showToast('All family points reset to zero.');

    const newEvent: ChoreEvent = {
      id: `evt_reset_zero_${Date.now()}`,
      householdId: activeHousehold?.id || 'default',
      type: 'point_adjustment',
      memberId: 'all',
      memberName: 'All Family',
      pointsBefore: members.reduce((sum, m) => sum + (m.currentPoints || 0), 0),
      pointsAfter: 0,
      pointsDelta: -members.reduce((sum, m) => sum + (m.currentPoints || 0), 0),
      reason: 'Family-wide reset: All member balances set to 0 pts',
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      members: updated,
      events: updatedEvents,
    }).catch(console.warn);
  };

  const handleResetAllToVerifiedPoints = () => {
    let totalBefore = 0;
    let totalAfter = 0;
    const updated = members.map(m => {
      totalBefore += (m.currentPoints || 0);
      // Calculate net chores earned
      const completedLogs = logs.filter(l => l.memberId === m.id && (l.status === 'approved' || (l as any).status === 'completed'));
      let chorePoints = 0;
      completedLogs.forEach(l => {
        const chore = chores.find(c => c.id === l.choreId);
        chorePoints += (l.pointsAwarded !== undefined ? l.pointsAwarded : (chore?.defaultPoints || 10)) + (l.bonusPoints || 0);
      });
      const memberClaims = claims.filter(c => c.memberId === m.id && c.status !== 'rejected');
      const spentPoints = memberClaims.reduce((sum, c) => sum + (c.pointCost || 0), 0);
      const verifiedBalance = Math.max(0, chorePoints - spentPoints);
      totalAfter += verifiedBalance;
      return {
        ...m,
        currentPoints: verifiedBalance,
      };
    });
    setMembers(updated);
    saveMembers(updated);
    soundFX.playStarChime(5);
    showToast('All family points synchronized to verified chore earnings!');

    const newEvent: ChoreEvent = {
      id: `evt_reset_verified_${Date.now()}`,
      householdId: activeHousehold?.id || 'default',
      type: 'point_adjustment',
      memberId: 'all',
      memberName: 'All Family',
      pointsBefore: totalBefore,
      pointsAfter: totalAfter,
      pointsDelta: totalAfter - totalBefore,
      reason: 'Family-wide sync: All member balances set to verified chore earnings',
      weekNumber: getISOWeekNumber(new Date()),
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      members: updated,
      events: updatedEvents,
    }).catch(console.warn);
  };

  const handleSetHouseXp = (newHouseXp: number, resetHelpersLifetimeXp?: boolean) => {
    const safeXp = Math.max(0, Math.round(newHouseXp));
    const updatedHhInfo: HouseholdInfo = {
      ...householdInfo,
      customHouseXp: safeXp,
    };
    setHouseholdInfo(updatedHhInfo);
    saveHouseholdInfo(updatedHhInfo);

    let updatedMembers = members;
    if (resetHelpersLifetimeXp) {
      const helperMembers = members.filter(x => x.role !== 'parent');
      const helperCount = Math.max(1, helperMembers.length);
      const perHelperLifetime = Math.round(safeXp / helperCount);
      updatedMembers = members.map(m => ({
        ...m,
        lifetimePoints: m.role === 'parent' ? 0 : perHelperLifetime,
      }));
      setMembers(updatedMembers);
      saveMembers(updatedMembers);
    }

    soundFX.playStarChime(5);
    triggerConfettiCelebration();
    showToast(`House XP set to ${safeXp.toLocaleString()} XP! 🏡✨`);

    const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
    syncCompleteHouseholdToCloud(targetHhId, {
      customHouseXp: safeXp,
      members: updatedMembers,
      familyName: updatedHhInfo.familyName,
      houseAddressOrMotto: updatedHhInfo.houseAddressOrMotto,
      housePhotoUrl: updatedHhInfo.housePhotoUrl,
    }).catch(console.warn);
  };

  const handleOpenPointManager = (memberId?: string) => {
    if (!isMomMode) {
      requestParentAuth(
        () => setPointManagerModalData({ isOpen: true, initialMemberId: memberId }),
        'Point Manager Security',
        'Enter Parent PIN to view and edit family points.'
      );
    } else {
      setPointManagerModalData({ isOpen: true, initialMemberId: memberId });
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
    const targetClaim = claims.find(c => c.id === claimId);
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

    // If this reward is linked to an avatar cosmetic, unlock it for the member
    let updatedMembersList = members;
    if (targetClaim) {
      const reward = rewards.find(r => r.id === targetClaim.rewardId);
      if (reward?.category === 'cosmetic' || reward?.cosmeticId) {
        const cosmeticIdToUnlock = reward.cosmeticId || (reward.id.startsWith('rew_cos_') ? reward.id.replace('rew_', '') : reward.id);
        updatedMembersList = members.map(m => {
          if (m.id === targetClaim.memberId) {
            const unlocked = m.unlockedCosmeticIds || [];
            const nextUnlocked = unlocked.includes(cosmeticIdToUnlock) ? unlocked : [...unlocked, cosmeticIdToUnlock];
            return {
              ...m,
              unlockedCosmeticIds: nextUnlocked,
              equippedCosmeticId: m.equippedCosmeticId || cosmeticIdToUnlock, // auto-equip if none equipped
            };
          }
          return m;
        });
        setMembers(updatedMembersList);
      }
    }

    triggerConfettiCelebration();
    soundFX.playRewardCoin();
    showToast('Reward claim approved! 🎉 Ready to enjoy.');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        claims: updated,
        members: updatedMembersList,
      }).catch(console.warn);
    }
  };

  const handleEquipCosmetic = (memberId: string, cosmeticId: string) => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          equippedCosmeticId: cosmeticId || undefined,
        };
      }
      return m;
    });
    setMembers(updated);
    showToast(cosmeticId ? 'Avatar cosmetic equipped! ✨' : 'Avatar cosmetic unequipped.');

    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updated,
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

  const handleUpdateReward = (updatedReward: RewardItem) => {
    const updated = rewards.map(r => r.id === updatedReward.id ? updatedReward : r);
    setRewards(updated);
    showToast(`Reward "${updatedReward.title}" updated.`);

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

  const handleResetRewardsToDefault = () => {
    soundFX.playPop();
    setRewards(INITIAL_REWARDS);
    saveRewards(INITIAL_REWARDS);
    showToast('Catalog restored with all 23 Game Theory rewards! ⭐');
    if (activeHousehold?.id) {
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        rewards: INITIAL_REWARDS,
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
    <div className={`min-h-screen ${theme.appBgClass} ${isGlassTheme(currentTheme) ? 'glass-theme-active' : ''} flex flex-col font-sans antialiased relative overflow-x-hidden transition-colors duration-300`}>
      {/* Real-time Dynamic Canvas Shader & Glass / Ice Optical Refraction Engine */}
      <GlassIceShaderBackground currentTheme={currentTheme} />

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
        onOpenHouseEvolution={() => {
          setHighlightMemberIdForHouse(undefined);
          setIsHouseEvolutionOpen(true);
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
        selectedMemberId={selectedMemberId}
        onSelectMember={(id) => setSelectedMemberId(id)}
        pendingInspectionCount={pendingInspectionCount}
        onOpenNewChore={() => setChoreModalData({ isOpen: true, choreToEdit: null })}
        forceMobileUi={forceMobileUi}
        onToggleMobileUi={toggleMobileUi}
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
        <div className="fixed top-18 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 chrome-glass chrome-glass-banner bg-amber-500/90 text-white p-3.5 rounded-2xl shadow-xl border border-amber-300/80 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 no-print">
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
        forceMobileUi={forceMobileUi}
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
        dimmed={
          isQuickSettingsOpen ||
          isCloudSyncModalOpen ||
          isHouseSettingsModalOpen ||
          isAIAssignModalOpen ||
          inspectModalData.isOpen ||
          choreModalData.isOpen ||
          memberModalData.isOpen ||
          isParentPinModalOpen
        }
      />

      {/* Primary Page Canvas */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 ${forceMobileUi ? "sm:pb-28" : "sm:pb-8"}`}>
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
            badgeStyle={badgeStyle}
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
            claims={claims}
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
            onOpenPointManager={handleOpenPointManager}
            onEquipCosmetic={handleEquipCosmetic}
            onQuickApprove={handleQuickApprove}
            onBatchApproveOverdue={handleBatchApproveOverdue}
            onMarkComplete={handleMarkComplete}
            onOpenInspect={(chore, log) => handleOpenInspect(chore, log)}
            onUndoApprove={handleUndoApprove}
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
            badgeStyle={badgeStyle}
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
            badgeStyle={badgeStyle}
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
            onOpenPointManager={handleOpenPointManager}
            onOpenHouseSettings={() => setIsHouseSettingsModalOpen(true)}
            onOpenProgression={(member) => {
              setProgressionModalData({
                isOpen: true,
                selectedMemberId: member?.id || (selectedMemberId !== 'all' ? selectedMemberId : members[0]?.id || ''),
              });
            }}
            onOpenHouseEvolution={(memberId) => {
              setHighlightMemberIdForHouse(memberId);
              setIsHouseEvolutionOpen(true);
            }}
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
            onUpdateReward={handleUpdateReward}
            onDeleteReward={handleDeleteReward}
            onNavigateToRedemptions={() => setCurrentView('redemptions')}
            onOpenProgression={() => {
              setProgressionModalData({
                isOpen: true,
                selectedMemberId: selectedMemberId !== 'all' ? selectedMemberId : members[0]?.id || '',
              });
            }}
            onResetRewardsToDefault={handleResetRewardsToDefault}
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
            currentTheme={currentTheme}
          />
        )}

        {currentView === 'calendar' && (
          <GoogleCalendarView
            chores={chores}
            members={members}
            selectedDate={currentDateStr}
            currentTheme={currentTheme}
          />
        )}
      </main>

      {/* House Settings & Photo Modal */}
      {isHouseSettingsModalOpen && (
        <HouseSettingsModal currentTheme={currentTheme}
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

      {/* Gamified Progression Journey & Cosmetics Locker Modal */}
      <ProgressionJourneyModal
        isOpen={progressionModalData.isOpen}
        onClose={() => setProgressionModalData(prev => ({ ...prev, isOpen: false }))}
        members={members}
        householdInfo={householdInfo}
        selectedMemberId={progressionModalData.selectedMemberId || (selectedMemberId !== 'all' ? selectedMemberId : members[0]?.id || '')}
        onSelectMember={(id) => setProgressionModalData(prev => ({ ...prev, selectedMemberId: id }))}
        onEquipCosmetic={handleEquipCosmetic}
        currentTheme={currentTheme}
        onNavigateToRewards={() => {
          setProgressionModalData(prev => ({ ...prev, isOpen: false }));
          setCurrentView('rewards');
        }}
        onOpenHouseEvolution={() => {
          setHighlightMemberIdForHouse(progressionModalData.selectedMemberId);
          setIsHouseEvolutionOpen(true);
        }}
      />

      {/* House Evolution & Epic Level Up Modal */}
      <HouseEvolutionModal
        isOpen={isHouseEvolutionOpen}
        onClose={() => {
          setIsHouseEvolutionOpen(false);
          setHighlightMemberIdForHouse(undefined);
        }}
        members={members}
        householdInfo={householdInfo}
        currentTheme={currentTheme}
        highlightMemberId={highlightMemberIdForHouse}
      />

      {/* Point Manager & Auditor Modal */}
      <PointManagerModal
        isOpen={pointManagerModalData.isOpen}
        onClose={() => setPointManagerModalData({ isOpen: false, initialMemberId: undefined })}
        members={members}
        chores={chores}
        logs={logs}
        claims={claims}
        events={events}
        householdInfo={householdInfo}
        currentTheme={currentTheme}
        initialMemberId={pointManagerModalData.initialMemberId}
        onSetMemberPoints={handleSetMemberPoints}
        onAdjustPoints={handleAdjustPoints}
        onResetAllSeedPoints={handleResetAllSeedPoints}
        onResetAllToVerified={handleResetAllToVerifiedPoints}
        onSetHouseXp={handleSetHouseXp}
      />

      {/* Cosmetics & Visual Effects Modal */}
      <CosmeticsManagerModal
        isOpen={cosmeticsModalData.isOpen}
        onClose={() => setCosmeticsModalData({ isOpen: false, initialMemberId: undefined })}
        members={members}
        selectedMemberId={cosmeticsModalData.initialMemberId}
        onEquipCosmetic={handleEquipCosmetic}
        currentTheme={currentTheme}
        isMomMode={isMomMode}
      />

      {/* Quick Settings & Tools Modal */}
      <QuickSettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        badgeStyle={badgeStyle}
        onSelectBadgeStyle={handleSelectBadgeStyle}
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
        onOpenPointManager={() => {
          if (!isMomMode) {
            requestParentAuth(
              () => setPointManagerModalData({ isOpen: true }),
              'Points & EXP Security',
              'Enter Parent PIN to adjust points, EXP, and House Level.'
            );
          } else {
            setPointManagerModalData({ isOpen: true });
          }
        }}
        onOpenCosmeticsManager={() => {
          setCosmeticsModalData({ isOpen: true });
        }}
        onResetDemo={handleResetDemo}
        isMomMode={isMomMode}
      />
    </div>
  );
}
