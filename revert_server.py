with open('server.ts', 'r') as f:
    content = f.read()

import re

old_logs = r"""    if \(Array\.isArray\(logs\)\) \{
      const existingMap = new Map\(\(existing\.logs \|\| \[\]\)\.map\(\(l: any\) => \[`\$\{l\.choreId\}_\$\{l\.date\}_\$\{l\.memberId\}`\, l\]\)\);
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
      \}
      existing\.logs = Array\.from\(existingMap\.values\(\)\);
    \}"""

new_logs = """    if (Array.isArray(logs)) {
      if (isStale) {
        const existingMap = new Map((existing.logs || []).map((l: any) => [`${l.choreId}_${l.date}_${l.memberId}`, l]));
        for (const l of logs) {
          const key = `${l.choreId}_${l.date}_${l.memberId}`;
          const prevL = existingMap.get(key);
          if (prevL) {
            if (l.checklistStatus && prevL.checklistStatus) {
              l.checklistStatus = { ...prevL.checklistStatus, ...l.checklistStatus };
            }
            l.id = prevL.id;
          }
          existingMap.set(key, l);
        }
        existing.logs = Array.from(existingMap.values());
      } else {
        existing.logs = logs;
      }
    }"""
content = re.sub(old_logs, new_logs, content)


old_claims = r"""    if \(Array\.isArray\(claims\)\) \{
      const existingMap = new Map\(\(existing\.claims \|\| \[\]\)\.map\(\(c: any\) => \[c\.id, c\]\)\);
      for \(const c of claims\) existingMap\.set\(c\.id, c\);
      existing\.claims = Array\.from\(existingMap\.values\(\)\);
    \}"""

new_claims = """    if (Array.isArray(claims)) {
      if (isStale) {
        const existingMap = new Map((existing.claims || []).map((c: any) => [c.id, c]));
        for (const c of claims) existingMap.set(c.id, c);
        existing.claims = Array.from(existingMap.values());
      } else {
        existing.claims = claims;
      }
    }"""
content = re.sub(old_claims, new_claims, content)

with open('server.ts', 'w') as f:
    f.write(content)
