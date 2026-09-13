const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The file got mangled. Let's fix handleUpdateChecklist specifically.

const re = /  const handleUpdateChecklist = \([\s\S]*?  const handleMarkComplete = \(/m;
const replacement = `  const handleUpdateChecklist = (
    choreId: string, 
    checklist: { [key: number]: boolean },
    targetDate?: string,
    targetMemberId?: string
  ) => {
    const effectiveDate = targetDate || currentDateStr;
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const effectiveAssigneeId = targetMemberId ||
      getChoreAssigneeForDate(chore, effectiveDate) || 
      (chore.assignedMemberId && chore.assignedMemberId !== 'unassigned' ? chore.assignedMemberId : undefined) || 
      members.find(m => m.role !== 'parent')?.id || 
      members[0]?.id || 
      'unassigned';

    const performUpdate = () => {
      const existingIndex = logs.findIndex(l => 
        l.choreId === choreId && 
        l.date === effectiveDate && 
        (!targetMemberId || l.memberId === targetMemberId)
      );

      let updatedLogs = [...logs];
      if (existingIndex >= 0) {
        updatedLogs[existingIndex] = {
          ...updatedLogs[existingIndex],
          checklistStatus: checklist,
        };
      } else {
        const newLog: ChoreAssignmentLog = {
          id: \`log_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`,
          choreId,
          memberId: effectiveAssigneeId,
          date: effectiveDate,
          status: 'pending',
          checklistStatus: checklist,
        };
        updatedLogs.push(newLog);
      }

      setLogs(updatedLogs);
      saveLogs(updatedLogs);

      const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
      syncCompleteHouseholdToCloud(targetHhId, { logs: updatedLogs }).catch(console.warn);
    };

    // Check PIN requirement for assignee
    const assigneeMember = members.find(m => m.id === effectiveAssigneeId);
    if (!isMomMode && assigneeMember && selectedMemberId !== effectiveAssigneeId && !isMemberAuthenticated(effectiveAssigneeId)) {
      if (assigneeMember.pin && assigneeMember.pin.trim() !== '') {
        setMemberPinModalData({
          isOpen: true,
          memberId: assigneeMember.id,
          expectedPin: assigneeMember.pin,
          memberName: assigneeMember.name,
          mode: 'verify',
          onSuccess: () => {
             authenticateMember(assigneeMember.id);
             performUpdate();
          },
        });
      } else {
        setMemberPinModalData({
          isOpen: true,
          memberId: assigneeMember.id,
          expectedPin: '',
          memberName: assigneeMember.name,
          mode: 'setup',
          onSuccess: (newPin?: string) => {
            if (newPin) {
              const updatedMember = { ...assigneeMember, pin: newPin };
              const updatedMembers = members.map(m => m.id === assigneeMember.id ? updatedMember : m);
              setMembers(updatedMembers);
              saveMembers(updatedMembers);
              const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
              syncCompleteHouseholdToCloud(targetHhId, { members: updatedMembers }).catch(console.warn);
              showToast(\`PIN set successfully for \${assigneeMember.name}!\`);
              authenticateMember(assigneeMember.id);
              performUpdate();
            }
          },
        });
      }
    } else {
      performUpdate();
    }
  };

  const handleMarkComplete = (`

code = code.replace(re, replacement);

fs.writeFileSync('src/App.tsx', code);
