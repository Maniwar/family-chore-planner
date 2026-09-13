const fs = require('fs');
let code = fs.readFileSync('src/components/ParentPinModal.tsx', 'utf8');

const replacementText = `
        <div className="text-center mt-6">
          <p className="text-[10px] text-slate-400">
            Forgot Parent PIN? Have another family admin log in, or reset via Cloud DB.
          </p>
        </div>
      </div>
    </div>
  );
};`;

code = code.replace(
  /      <\/div>\n    <\/div>\n  \);\n};\n?/g,
  replacementText
);

fs.writeFileSync('src/components/ParentPinModal.tsx', code);
