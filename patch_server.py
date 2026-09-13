with open('server.ts', 'r') as f:
    content = f.read()

merge_logic = """
    if (Array.isArray(members)) {
      const existingMap = new Map((existing.members || []).map((m: any) => [m.id, m]));
      for (const m of members) {
        const prevM = existingMap.get(m.id);
        if (prevM?.avatarPhotoUrl && (!m.avatarPhotoUrl || m.avatarPhotoUrl.trim() === "")) {
          m.avatarPhotoUrl = prevM.avatarPhotoUrl;
        }
        existingMap.set(m.id, m);
      }
      existing.members = Array.from(existingMap.values());
    }

    if (Array.isArray(chores)) {
      const existingMap = new Map((existing.chores || []).map((c: any) => [c.id, c]));
      for (const c of chores) existingMap.set(c.id, c);
      existing.chores = Array.from(existingMap.values());
    }

    if (Array.isArray(logs)) {
      // Merge logs by composite key: choreId + date + memberId
      const existingMap = new Map((existing.logs || []).map((l: any) => [`${l.choreId}_${l.date}_${l.memberId}`, l]));
      for (const l of logs) {
        const key = `${l.choreId}_${l.date}_${l.memberId}`;
        const prevL = existingMap.get(key);
        if (prevL) {
          // Merge checklistStatus
          if (l.checklistStatus && prevL.checklistStatus) {
            l.checklistStatus = { ...prevL.checklistStatus, ...l.checklistStatus };
          }
          // Only overwrite if the incoming log represents a state progression or new data
          // Actually, just taking the incoming one but merging the checklist is usually sufficient.
          l.id = prevL.id; // Keep the original ID to avoid duplicates
        }
        existingMap.set(key, l);
      }
      existing.logs = Array.from(existingMap.values());
    }

    if (Array.isArray(rewards)) {
      const existingMap = new Map((existing.rewards || []).map((r: any) => [r.id, r]));
      for (const r of rewards) existingMap.set(r.id, r);
      existing.rewards = Array.from(existingMap.values());
    }

    if (Array.isArray(claims)) {
      const existingMap = new Map((existing.claims || []).map((c: any) => [c.id, c]));
      for (const c of claims) existingMap.set(c.id, c);
      existing.claims = Array.from(existingMap.values());
    }
"""

import re
old_logic = r"""    if \(Array\.isArray\(members\)\) \{
      existing\.members = members\.map\(\(m: any\) => \{
        const prevM = existing\.members\?\.find\(\(em: any\) => em\.id === m\.id\);
        if \(prevM\?\.avatarPhotoUrl && \(\!m\.avatarPhotoUrl \|\| m\.avatarPhotoUrl\.trim\(\) === ""\)\) \{
          return \{ \.\.\.m, avatarPhotoUrl: prevM\.avatarPhotoUrl \};
        \}
        return m;
      \}\);
    \}
    if \(Array\.isArray\(chores\)\) existing\.chores = chores;
    if \(Array\.isArray\(logs\)\) existing\.logs = logs;
    if \(Array\.isArray\(rewards\)\) existing\.rewards = rewards;
    if \(Array\.isArray\(claims\)\) existing\.claims = claims;"""

content = re.sub(old_logic, merge_logic, content, flags=re.MULTILINE)

with open('server.ts', 'w') as f:
    f.write(content)
