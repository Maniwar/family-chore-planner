const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /      if \(cloudHh\.members && cloudHh\.members\.length > 0\) \{\n        setMembers\(prevMembers => \{\n          return cloudHh\.members!\.map\(cm => \{\n            const localMatch = prevMembers\.find\(lm => lm\.id === cm\.id\);\n            if \(localMatch\?\.avatarPhotoUrl && \(\!cm\.avatarPhotoUrl \|\| cm\.avatarPhotoUrl\.trim\(\) === ''\)\) \{\n              return \{\n                \.\.\.cm,\n                avatarPhotoUrl: localMatch\.avatarPhotoUrl,\n              \};\n            \}\n            return cm;\n          \}\);\n        \}\);\n      \}/g,
  `      if (cloudHh.members && cloudHh.members.length > 0) {
        setMembers(prevMembers => {
          const newMembers = cloudHh.members!.map(cm => {
            const localMatch = prevMembers.find(lm => lm.id === cm.id);
            if (localMatch?.avatarPhotoUrl && (!cm.avatarPhotoUrl || cm.avatarPhotoUrl.trim() === '')) {
              return {
                ...cm,
                avatarPhotoUrl: localMatch.avatarPhotoUrl,
              };
            }
            return cm;
          });
          saveMembers(newMembers);
          return newMembers;
        });
      }`
);

fs.writeFileSync('src/App.tsx', code);
