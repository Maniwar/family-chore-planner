import re

with open('src/utils/firebaseSync.ts', 'r') as f:
    content = f.read()

replacement = """export async function syncCompleteHouseholdToCloud(
  householdId: string | null | undefined,
  payload: {
    familyName?: string;
    houseAddressOrMotto?: string;
    housePhotoUrl?: string;
    householdCode?: string;
    adminPin?: string;
    pinProtectionEnabled?: boolean;
    joinPassphrase?: string;
    members?: HouseholdMember[];
    chores?: Chore[];
    logs?: ChoreAssignmentLog[];
    rewards?: RewardItem[];
    claims?: RewardClaim[];
    penaltySettings?: any;
    events?: any[];
    nudges?: any[];
    customHouseXp?: number;
    version?: number;
  }
): Promise<void> {
  if (!householdId) {
    console.warn("Attempted to sync without a valid household ID. Changes are queued locally.");
    return;
  }

  const now = new Date().toISOString();
  const fullData = {
    id: householdId,
    ...payload,
    updatedAt: now,
  };

  const res = await fetch(`/api/household/${encodeURIComponent(householdId)}/sync`, {
    method: 'POST',
    headers: getHouseholdAuthHeaders(householdId),
    body: JSON.stringify(fullData),
  });

  if (res.ok) {
    const data = await res.json();
    if (data?.authKey) {
      setHouseholdAuthToken(householdId, data.authKey);
    }
  } else {
    let errBody;
    try {
      errBody = await res.json();
    } catch {
      errBody = { error: res.statusText };
    }
    const errObj = new Error(errBody.error || `Failed to sync: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).body = errBody;
    throw errObj;
  }
}"""

content = re.sub(r'export async function syncCompleteHouseholdToCloud\([\s\S]*?}\n} catch \(e\) {\n\s+console\.warn\(\'Server sync notice:\', e\);\n\s+}\n}', replacement, content)

with open('src/utils/firebaseSync.ts', 'w') as f:
    f.write(content)
