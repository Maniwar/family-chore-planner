const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSyntax = `    } else {
      performClaim();
    }
  };
      syncCompleteHouseholdToCloud(activeHousehold.id, {
        members: updatedMembers,
        claims: updatedClaims,
      }).catch(console.warn);
    }
  };`;

const newSyntax = `    } else {
      performClaim();
    }
  };`;

code = code.replace(oldSyntax, newSyntax);
fs.writeFileSync('src/App.tsx', code);
