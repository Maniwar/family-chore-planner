import re

with open('src/utils/firebaseSync.ts', 'r') as f:
    content = f.read()

# Fix 1: createNewHousehold throwing error on !res.ok and accepting server-side householdCode
old_create = r"""  // 1\. Sync to server API \(bulletproof fallback\)
  try \{
    const res = await fetch\('/api/household/create', \{
      method: 'POST',
      headers: \{ 'Content-Type': 'application/json' \},
      body: JSON\.stringify\(householdData\),
    \}\);
    if \(res\.ok\) \{
      const data = await res\.json\(\);
      if \(data\.authKey\) \{
        setHouseholdAuthToken\(householdId, data\.authKey\);
      \}
      if \(data\.household\) \{
        Object\.assign\(householdData, data\.household\);
      \}
    \}
  \} catch \(e\) \{
    console\.warn\('Server API create notice:', e\);
  \}

  // Set active session
  setCurrentHouseholdId\(householdId\);
  return householdData;
\}"""

new_create = """  // 1. Sync to server API (bulletproof fallback)
  let data;
  try {
    const res = await fetch('/api/household/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(householdData),
    });
    if (!res.ok) {
      let errBody;
      try { errBody = await res.json(); } catch { errBody = { error: res.statusText }; }
      throw new Error(errBody.error || `Failed to create household: ${res.status}`);
    }
    data = await res.json();
  } catch (e: any) {
    console.error('Server API create error:', e);
    throw new Error(e.message || 'Network error during household creation');
  }

  if (data.authKey) {
    setHouseholdAuthToken(householdId, data.authKey);
  }
  if (data.household) {
    Object.assign(householdData, data.household);
  }
  if (data.householdCode) {
    householdData.householdCode = data.householdCode;
  }

  // Only set active session if creation was successful
  setCurrentHouseholdId(householdId);
  return householdData;
}"""
content = re.sub(old_create, new_create, content)

# Fix 2: syncCompleteHouseholdToCloud rejecting promise
old_sync = r"""  if \(\!householdId\) \{
    console\.warn\("Attempted to sync without a valid household ID\. Changes are queued locally\."\);
    return;
  \}"""

new_sync = """  if (!householdId) {
    return Promise.reject(new Error("Changes saved locally only (Not connected to a Cloud Household)."));
  }"""
content = re.sub(old_sync, new_sync, content)

# Fix 3: Add getHouseholdCodeFromCloud
get_code = """
export async function getHouseholdCodeFromCloud(householdId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/household/${encodeURIComponent(householdId)}/code`, {
      headers: getHouseholdAuthHeaders(householdId),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.householdCode) return data.householdCode;
    }
  } catch (e) {
    console.error("Failed to fetch household code", e);
  }
  return null;
}
"""
content = content + get_code

with open('src/utils/firebaseSync.ts', 'w') as f:
    f.write(content)
