import re

with open('src/utils/firebaseSync.ts', 'r') as f:
    content = f.read()

old_getHousehold = r"""export async function getHousehold\(householdId: string\): Promise<CloudHousehold \| null> \{
  // Use API
  try \{
    const res = await fetch\(`/api/household/\$\{encodeURIComponent\(householdId\)\}`, \{
      headers: getHouseholdAuthHeaders\(householdId\),
    \}\);
    if \(res\.ok\) \{
      const data = await res\.json\(\);
      if \(data\?\.household\) \{
        if \(data\.authKey\) \{
          setHouseholdAuthToken\(householdId, data\.authKey\);
        \}
        return data\.household as CloudHousehold;
      \}
    \} else if \(res\.status === 401 \|\| res\.status === 403\) \{
      console\.warn\('Household access unauthorized\. Invalid credentials for:', householdId\);
      return null;
    \}
  \} catch \(e\) \{
    // network issue
  \}
  return null;
\}"""

new_getHousehold = """export async function getHousehold(householdId: string): Promise<CloudHousehold | null> {
  try {
    const res = await fetch(`/api/household/${encodeURIComponent(householdId)}`, {
      headers: getHouseholdAuthHeaders(householdId),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.household) {
        if (data.authKey) {
          setHouseholdAuthToken(householdId, data.authKey);
        }
        const household = data.household as CloudHousehold;
        // Fetch code securely
        const codeRes = await fetch(`/api/household/${encodeURIComponent(householdId)}/code`, {
          headers: getHouseholdAuthHeaders(householdId),
        });
        if (codeRes.ok) {
          const codeData = await codeRes.json();
          if (codeData.householdCode) household.householdCode = codeData.householdCode;
        }
        return household;
      }
    } else if (res.status === 401 || res.status === 403) {
      console.warn('Household access unauthorized. Invalid credentials for:', householdId);
      return null;
    }
  } catch (e) {
    // network issue
  }
  return null;
}"""
content = re.sub(old_getHousehold, new_getHousehold, content)

with open('src/utils/firebaseSync.ts', 'w') as f:
    f.write(content)
