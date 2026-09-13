const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// There's a missing brace for the first block (handleUpdateChecklist)
const findStr = `              authenticateMember(assigneeMember.id);
              performUpdate();
            }
          },
        });`;

const replaceStr = `              authenticateMember(assigneeMember.id);
              performUpdate();
            }
          },
        });
      }
    } else {
      performUpdate();
    }
  };`;

if (code.includes(findStr) && !code.includes(replaceStr)) {
    code = code.replace(findStr, replaceStr);
}

fs.writeFileSync('src/App.tsx', code);
