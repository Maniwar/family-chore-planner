const fs = require('fs');
let code = fs.readFileSync('src/components/MemberModal.tsx', 'utf8');

// Replace the text below the PIN input with a lock icon + descriptive text
code = code.replace(
  /<p className="text-\[10px\] text-slate-400 mt-0\.5">\s*Lock this profile so only they can view and manage their chores\.\s*<\/p>/m,
  `<div className="flex items-start gap-1.5 mt-1">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-tight">
                Setting a PIN locks this profile so only they can claim rewards and complete chores.
              </p>
            </div>`
);

// We also need to import Lock if it isn't already imported
if (!code.includes('Lock,')) {
  code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import { Lock, $1 } from 'lucide-react';");
}

fs.writeFileSync('src/components/MemberModal.tsx', code);
