with open('server.ts', 'r') as f:
    content = f.read()

import re

# We want to change the logs merging logic to ignore `isStale`
old_logs_logic = r"""    if \(Array\.isArray\(logs\)\) \{
      if \(isStale\) \{
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
      \} else \{
        existing\.logs = logs;
      \}
    \}"""

new_logs_logic = """    if (Array.isArray(logs)) {
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
    }"""

content = re.sub(old_logs_logic, new_logs_logic, content)

old_claims_logic = r"""    if \(Array\.isArray\(claims\)\) \{
      if \(isStale\) \{
        const existingMap = new Map\(\(existing\.claims \|\| \[\]\)\.map\(\(c: any\) => \[c\.id, c\]\)\);
        for \(const c of claims\) existingMap\.set\(c\.id, c\);
        existing\.claims = Array\.from\(existingMap\.values\(\)\);
      \} else \{
        existing\.claims = claims;
      \}
    \}"""

new_claims_logic = """    if (Array.isArray(claims)) {
      const existingMap = new Map((existing.claims || []).map((c: any) => [c.id, c]));
      for (const c of claims) existingMap.set(c.id, c);
      existing.claims = Array.from(existingMap.values());
    }"""

content = re.sub(old_claims_logic, new_claims_logic, content)

with open('server.ts', 'w') as f:
    f.write(content)
