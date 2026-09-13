const fs = require('fs');
let code = fs.readFileSync('src/components/MemberPinModal.tsx', 'utf8');

const targetText = `<div className="flex justify-between items-center mb-6">`;
const replacementText = `
        {mode === 'verify' && (
          <div className="text-center mt-6">
            <p className="text-[10px] text-slate-400">
              Forgot PIN? Ask Mom to reset it in Family Members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};`;

code = code.replace(
  /      <\/div>\n    <\/div>\n  \);\n};\n?/g,
  replacementText
);

fs.writeFileSync('src/components/MemberPinModal.tsx', code);
