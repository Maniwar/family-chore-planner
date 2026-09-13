import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix 1: Return householdCode in create
create_return_old = r"""    return res\.json\(\{ success: true, household: sanitizeHousehold\(record\), authKey \}\);"""
create_return_new = """    return res.json({ success: true, household: sanitizeHousehold(record), authKey, householdCode: code });"""
content = re.sub(create_return_old, create_return_new, content)

# Fix 2: Add GET /api/household/:id/code
new_route = """
// Root Cause 4: Authenticated route to retrieve the join code
app.get("/api/household/:id/code", async (req, res) => {
  try {
    const hhId = req.params.id;
    if (!hhId) {
      return res.status(400).json({ error: "Household ID required" });
    }
    const found = await getHouseholdFromStore(hhId);
    if (!found) {
      return res.status(404).json({ error: "Household not found" });
    }
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!found.authKey || token !== found.authKey) {
      return res.status(401).json({ error: "Unauthorized access to household code" });
    }
    return res.json({ success: true, householdCode: found.householdCode });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to get household code" });
  }
});
"""

# Insert before `app.post(["/api/household/join"`
content = content.replace('app.post(["/api/household/join", "/api/household/by-code/:code/join"]', new_route + '\napp.post(["/api/household/join", "/api/household/by-code/:code/join"]')

with open('server.ts', 'w') as f:
    f.write(content)
