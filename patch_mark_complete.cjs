const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleMarkComplete = (
    choreId: string, 
    notes?: string, 
    checklist?: { [key: number]: boolean },
    targetDate?: string,
    targetMemberId?: string
  ) => {
    const todayDate = getTodayDateString();
    const effectiveDate = targetDate || currentDateStr;

    // Disallow completing chores ahead of their scheduled date
    if (effectiveDate > todayDate) {
      soundFX.playPop();
      showToast('Chores cannot be completed before their scheduled day.');
      return;
    }

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
        id: \`log_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
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
  };`;

const replacement = `  const handleMarkComplete = (
    choreId: string, 
    notes?: string, 
    checklist?: { [key: number]: boolean },
    targetDate?: string,
    targetMemberId?: string
  ) => {
    const todayDate = getTodayDateString();
    const effectiveDate = targetDate || currentDateStr;

    // Disallow completing chores ahead of their scheduled date
    if (effectiveDate > todayDate) {
      soundFX.playPop();
      showToast('Chores cannot be completed before their scheduled day.');
      return;
    }

    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const existingIndex = logs.findIndex(l => 
      l.choreId === choreId && 
      l.date === effectiveDate && 
      (!targetMemberId || l.memberId === targetMemberId)
    );

    const effectiveAssigneeId = targetMemberId ||
      getChoreAssigneeForDate(chore, effectiveDate) || 
      (chore.assignedMemberId && chore.assignedMemberId !== 'unassigned' ? chore.assignedMemberId : undefined) || 
      members.find(m => m.role !== 'parent')?.id || 
      members[0]?.id || 
      'unassigned';

    const performComplete = () => {
      // If already exists and no new checklist data is passed, toggle it off!
      if (existingIndex >= 0 && (!checklist || Object.keys(checklist).length === 0) && (!notes || notes.trim() === '')) {
        if (logs[existingIndex].status === 'approved') {
          handleUndoApprove(choreId, logs[existingIndex].id);
        } else {
          // It's needs_review, just remove the log to uncheck it
          const updatedLogs = logs.filter((_, i) => i !== existingIndex);
          setLogs(updatedLogs);
          saveLogs(updatedLogs);
          const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
          syncCompleteHouseholdToCloud(targetHhId, { logs: updatedLogs }).catch(console.warn);
          soundFX.playPop();
          showToast('Chore unchecked.');
        }
        return;
      }

      soundFX.playComplete();

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
          id: \`log_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
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

    // Check PIN requirement for assignee
    const assigneeMember = members.find(m => m.id === effectiveAssigneeId);
    if (!isMomMode && assigneeMember && assigneeMember.pin && assigneeMember.pin.trim() !== '' && selectedMemberId !== effectiveAssigneeId) {
      setMemberPinModalData({
        isOpen: true,
        memberId: assigneeMember.id,
        expectedPin: assigneeMember.pin,
        memberName: assigneeMember.name,
        onSuccess: performComplete,
      });
    } else {
      performComplete();
    }
  };`;

app = app.replace(target, replacement);
fs.writeFileSync('src/App.tsx', app);
