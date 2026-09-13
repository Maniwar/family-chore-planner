const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const handleClaimReward = (rewardId: string, memberId: string, note?: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    const member = members.find(m => m.id === memberId);
    if (!reward || !member) return;

    if (member.currentPoints < reward.pointCost) {
      showToast(\`\${member.name} needs \${reward.pointCost - member.currentPoints} more points for this reward.\`);
      return;
    }

    const performClaim = () => {
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
      saveMembers(updatedMembers);

      const newClaim: RewardClaim = {
        id: \`claim_\${Date.now()}\`,
        rewardId: reward.id,
        rewardTitle: reward.title,
        memberId,
        memberName: member.name,
        pointCost: reward.pointCost,
        claimedAt: new Date().toISOString(),
        status: 'pending',
        childNote: note,
      };

      const updatedClaims = [newClaim, ...claims];
      setClaims(updatedClaims);
      saveClaims(updatedClaims);
      soundFX.playRewardCoin();
      showToast(\`Reward "\${reward.title}" requested for \${member.name}! Mom will review.\`);

      const targetHhId = activeHousehold?.id || getCurrentHouseholdId() || 'household_default';
      syncCompleteHouseholdToCloud(targetHhId, {
        members: updatedMembers,
        claims: updatedClaims
      }).catch(console.warn);
    };

    if (!isMomMode && !isMemberAuthenticated(memberId)) {
      if (member.pin && member.pin.trim() !== '') {
        setMemberPinModalData({
          isOpen: true,
          memberId: member.id,
          expectedPin: member.pin,
          memberName: member.name,
          mode: 'verify',
          onSuccess: () => {
            authenticateMember(member.id);
            performClaim();
          },
        });
      } else {
        setMemberPinModalData({
          isOpen: true,
          memberId: member.id,
          expectedPin: '',
          memberName: member.name,
          mode: 'setup',
          onSuccess: (newPin) => {
            handleSetMemberPin(member.id, newPin);
            authenticateMember(member.id);
            performClaim();
          },
        });
      }
    } else {
      performClaim();
    }
  };`;

// Regex to replace from `const handleClaimReward = ` down to `showToast("Reward...requested")` or similar.
const re = /  const handleClaimReward = \(rewardId: string, memberId: string\) => \{[\s\S]*?showToast\(`Reward "\$\{reward\.title\}" requested for \$\{member\.name\}! Mom will review.`\);\n\s*(const targetHhId = [^\n]*;\n\s*syncCompleteHouseholdToCloud[^\n]*\n\s*[^\n]*\n\s*[^\n]*\n\s*\}\)|[^\n]*)/;
code = code.replace(re, replacement);
fs.writeFileSync('src/App.tsx', code);
