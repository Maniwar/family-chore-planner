import re

with open('server.ts', 'r') as f:
    content = f.read()

# Members
old_members_stale = r"""        const existingMap = new Map\(\(existing\.members \|\| \[\]\)\.map\(\(m: any\) => \[m\.id, m\]\)\);
        for \(const m of members\) \{
          const prevM = existingMap\.get\(m\.id\);
          if \(prevM\?\.avatarPhotoUrl && \(\!m\.avatarPhotoUrl \|\| m\.avatarPhotoUrl\.trim\(\) === ""\)\) \{
            m\.avatarPhotoUrl = prevM\.avatarPhotoUrl;
          \}
          existingMap\.set\(m\.id, m\);
        \}"""

new_members_stale = """        const existingMap = new Map((existing.members || []).map((m: any) => [m.id, m]));
        for (const m of members) {
          const prevM = existingMap.get(m.id);
          existingMap.set(m.id, prevM ? {
            ...prevM,
            ...m,
            avatarPhotoUrl: (!m.avatarPhotoUrl || m.avatarPhotoUrl.trim() === "") && prevM.avatarPhotoUrl ? prevM.avatarPhotoUrl : m.avatarPhotoUrl
          } : m);
        }"""
content = re.sub(old_members_stale, new_members_stale, content)

# Chores
old_chores_stale = r"""        const existingMap = new Map\(\(existing\.chores \|\| \[\]\)\.map\(\(c: any\) => \[c\.id, c\]\)\);
        for \(const c of chores\) existingMap\.set\(c\.id, c\);"""
new_chores_stale = """        const existingMap = new Map((existing.chores || []).map((c: any) => [c.id, c]));
        for (const c of chores) {
          const prevC = existingMap.get(c.id);
          existingMap.set(c.id, prevC ? { ...prevC, ...c } : c);
        }"""
content = re.sub(old_chores_stale, new_chores_stale, content)

# Logs
old_logs_stale = r"""        const existingMap = new Map\(\(existing\.logs \|\| \[\]\)\.map\(\(l: any\) => \[`\$\{l\.choreId\}_\$\{l\.date\}_\$\{l\.memberId\}`, l\]\)\);
        for \(const l of logs\) \{
          const key = `\$\{l\.choreId\}_\$\{l\.date\}_\$\{l\.memberId\}`;
          const prevL = existingMap\.get\(key\);
          if \(prevL\) \{
            if \(l\.checklistStatus && prevL\.checklistStatus\) \{
              l\.checklistStatus = \{ \.\.\.prevL\.checklistStatus, \.\.\.l\.checklistStatus \};
            \}
            l\.id = prevL\.id;
          \}
          existingMap\.set\(key, l\);
        \}"""
new_logs_stale = """        const existingMap = new Map((existing.logs || []).map((l: any) => [`${l.choreId}_${l.date}_${l.memberId}`, l]));
        for (const l of logs) {
          const key = `${l.choreId}_${l.date}_${l.memberId}`;
          const prevL = existingMap.get(key);
          existingMap.set(key, prevL ? {
            ...prevL,
            ...l,
            id: prevL.id,
            checklistStatus: { ...(prevL.checklistStatus || {}), ...(l.checklistStatus || {}) }
          } : l);
        }"""
content = re.sub(old_logs_stale, new_logs_stale, content)

# Rewards
old_rewards_stale = r"""        const existingMap = new Map\(\(existing\.rewards \|\| \[\]\)\.map\(\(r: any\) => \[r\.id, r\]\)\);
        for \(const r of rewards\) existingMap\.set\(r\.id, r\);"""
new_rewards_stale = """        const existingMap = new Map((existing.rewards || []).map((r: any) => [r.id, r]));
        for (const r of rewards) {
          const prevR = existingMap.get(r.id);
          existingMap.set(r.id, prevR ? { ...prevR, ...r } : r);
        }"""
content = re.sub(old_rewards_stale, new_rewards_stale, content)

# Claims
old_claims_stale = r"""        const existingMap = new Map\(\(existing\.claims \|\| \[\]\)\.map\(\(c: any\) => \[c\.id, c\]\)\);
        for \(const c of claims\) existingMap\.set\(c\.id, c\);"""
new_claims_stale = """        const existingMap = new Map((existing.claims || []).map((c: any) => [c.id, c]));
        for (const c of claims) {
          const prevC = existingMap.get(c.id);
          existingMap.set(c.id, prevC ? { ...prevC, ...c } : c);
        }"""
content = re.sub(old_claims_stale, new_claims_stale, content)


with open('server.ts', 'w') as f:
    f.write(content)
