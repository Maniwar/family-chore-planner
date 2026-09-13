const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state for authenticated members
const authCacheState = `
  // Local auth cache to remember PIN verifications (memberId -> timestamp)
  const [authenticatedMembers, setAuthenticatedMembers] = useState<Record<string, number>>({});
  const AUTH_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
  
  const isMemberAuthenticated = (memberId: string) => {
    if (isMomMode) return true; // Mom bypasses
    const authTime = authenticatedMembers[memberId];
    if (!authTime) return false;
    return (Date.now() - authTime) < AUTH_EXPIRY_MS;
  };

  const authenticateMember = (memberId: string) => {
    setAuthenticatedMembers(prev => ({ ...prev, [memberId]: Date.now() }));
  };
`;

code = code.replace(
  '  const [isHouseEvolutionOpen, setIsHouseEvolutionOpen] = useState<boolean>(false);\n',
  `  const [isHouseEvolutionOpen, setIsHouseEvolutionOpen] = useState<boolean>(false);\n${authCacheState}`
);

// 2. Update handleSelectMember
const handleSelectMemberRe = /  const handleSelectMember = \(id: string\) => {[\s\S]*?  };\n/m;
const newHandleSelectMember = `  const handleSelectMember = (id: string) => {
    if (id === 'all') {
      setSelectedMemberId('all');
      return;
    }

    const member = members.find(m => m.id === id);
    if (!member) return;

    if (!isMomMode && !isMemberAuthenticated(id)) {
      if (member.pin && member.pin.trim() !== '') {
        setMemberPinModalData({
          isOpen: true,
          memberId: id,
          expectedPin: member.pin,
          memberName: member.name,
          mode: 'verify',
          onSuccess: () => {
            authenticateMember(id);
            setSelectedMemberId(id);
          }
        });
      } else {
        setMemberPinModalData({
          isOpen: true,
          memberId: id,
          expectedPin: '',
          memberName: member.name,
          mode: 'setup',
          onSuccess: (newPin?: string) => {
            if (newPin) {
              const updatedMember = { ...member, pin: newPin };
              const updatedMembers = members.map(m => m.id === member.id ? updatedMember : m);
              setMembers(updatedMembers);
              saveMembers(updatedMembers);
              const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
              syncCompleteHouseholdToCloud(targetHhId, { members: updatedMembers }).catch(console.warn);
              showToast(\`PIN set successfully for \${member.name}!\`);
              authenticateMember(id);
              setSelectedMemberId(id);
            }
          }
        });
      }
    } else {
      setSelectedMemberId(id);
    }
  };
`;
code = code.replace(handleSelectMemberRe, newHandleSelectMember);

// 3. Update handleMarkComplete (PIN check block)
const pinCheckBlockRe = /    \/\/ Check PIN requirement for assignee[\s\S]*?    } else {\n      performComplete\(\);\n    }/m;
const newPinCheckBlock = `    // Check PIN requirement for assignee
    const assigneeMember = members.find(m => m.id === effectiveAssigneeId);
    
    // Only check if it's assigned to someone else, AND we are not authenticated for them
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
             performComplete();
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
              performComplete();
            }
          },
        });
      }
    } else {
      performComplete();
    }`;
code = code.replace(pinCheckBlockRe, newPinCheckBlock);

fs.writeFileSync('src/App.tsx', code);
