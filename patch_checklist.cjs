803:  const handleUpdateChecklist = (
804-    choreId: string, 
805-    checklist: { [key: number]: boolean },
806-    targetDate?: string,
807-    targetMemberId?: string
808-  ) => {
809-    const effectiveDate = targetDate || currentDateStr;
810-    const chore = chores.find(c => c.id === choreId);
811-    if (!chore) return;
812-
813-    const effectiveAssigneeId = targetMemberId ||
814-      getChoreAssigneeForDate(chore, effectiveDate) || 
815-      (chore.assignedMemberId && chore.assignedMemberId !== 'unassigned' ? chore.assignedMemberId : undefined) || 
816-      members.find(m => m.role !== 'parent')?.id || 
817-      members[0]?.id || 
818-      'unassigned';
819-
820-    const performUpdate = () => {
821-      const existingIndex = logs.findIndex(l => 
822-        l.choreId === choreId && 
823-        l.date === effectiveDate && 
824-        (!targetMemberId || l.memberId === targetMemberId)
825-      );
826-
827-      let updatedLogs = [...logs];
828-      if (existingIndex >= 0) {
829-        updatedLogs[existingIndex] = {
830-          ...updatedLogs[existingIndex],
831-          checklistStatus: checklist,
832-        };
833-      } else {
834-        const newLog: ChoreAssignmentLog = {
835-          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
836-          choreId,
837-          memberId: effectiveAssigneeId,
838-          date: effectiveDate,
839-          status: 'pending',
840-          checklistStatus: checklist,
841-        };
842-        updatedLogs.push(newLog);
843-      }
844-
845-      setLogs(updatedLogs);
846-      saveLogs(updatedLogs);
847-
848-      const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
849-      syncCompleteHouseholdToCloud(targetHhId, { logs: updatedLogs }).catch(console.warn);
850-    };
851-
852-    // Check PIN requirement for assignee
853-    const assigneeMember = members.find(m => m.id === effectiveAssigneeId);
854-    if (!isMomMode && assigneeMember && selectedMemberId !== effectiveAssigneeId && !isMemberAuthenticated(effectiveAssigneeId)) {
855-      if (assigneeMember.pin && assigneeMember.pin.trim() !== '') {
856-        setMemberPinModalData({
857-          isOpen: true,
858-          memberId: assigneeMember.id,
859-          expectedPin: assigneeMember.pin,
860-          memberName: assigneeMember.name,
861-          mode: 'verify',
862-          onSuccess: () => {
863-             authenticateMember(assigneeMember.id);
864-             performUpdate();
865-          },
866-        });
867-      } else {
868-        setMemberPinModalData({
869-          isOpen: true,
870-          memberId: assigneeMember.id,
871-          expectedPin: '',
872-          memberName: assigneeMember.name,
873-          mode: 'setup',
874-          onSuccess: (newPin?: string) => {
875-            if (newPin) {
876-              const updatedMember = { ...assigneeMember, pin: newPin };
877-              const updatedMembers = members.map(m => m.id === assigneeMember.id ? updatedMember : m);
878-              setMembers(updatedMembers);
879-              saveMembers(updatedMembers);
880-              const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
881-              syncCompleteHouseholdToCloud(targetHhId, { members: updatedMembers }).catch(console.warn);
882-              showToast(`PIN set successfully for ${assigneeMember.name}!`);
883-              authenticateMember(assigneeMember.id);
884-              performUpdate();
885-            }
886-          },
887-        });
888-      }
889-    } else {
890-      performUpdate();
891-    }
892-  };
893-
894-  const handleMarkComplete = (
895-    choreId: string, 
896-    notes?: string, 
897-    checklist?: { [key: number]: boolean },
898-    targetDate?: string,
899-    targetMemberId?: string
900-  ) => {
901-    const todayDate = getTodayDateString();
902-    const effectiveDate = targetDate || currentDateStr;
903-
