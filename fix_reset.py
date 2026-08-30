import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

replacements = [
    (r"const \[showResetConfirm, setShowResetConfirm\] = useState<boolean>\(false\);",
     r"const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);\n  const [resetPasswordInput, setResetPasswordInput] = useState<string>('');\n  const [resetError, setResetError] = useState<string>('');"),
     
    (r"onClick=\{\(\) => \{\n                        soundFX.playPop\(\);\n                        setShowResetConfirm\(true\);\n                      \}\}",
     r"onClick={() => {\n                        soundFX.playPop();\n                        setShowResetConfirm(true);\n                        setResetPasswordInput('');\n                        setResetError('');\n                      }}"),
     
    (r"\{showResetConfirm && \(\n                  <div className=\"p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 animate-in fade-in\">\n                    <p className=\"text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5\">\n                      <AlertTriangle className=\"w-4 h-4 text-rose-600 shrink-0\" />\n                      <span>Are you sure\? This restores sample data on this device\.</span>\n                    </p>\n                    <div className=\"flex items-center gap-2 pt-1\">\n                      <button\n                        type=\"button\"\n                        onClick=\{\(\) => \{\n                          soundFX.playPop\(\);\n                          onResetDemo\(\);\n                          setShowResetConfirm\(false\);\n                          onClose\(\);\n                        \}\}",
     r"""{showResetConfirm && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3 animate-in fade-in">
                    <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Are you sure? This restores sample data on this device.</span>
                    </p>
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder={isPinEnabled ? "Enter Parent PIN to confirm" : "Type RESET to confirm"}
                        value={resetPasswordInput}
                        onChange={(e) => {
                          setResetPasswordInput(e.target.value);
                          setResetError('');
                        }}
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:ring-2 focus:ring-rose-500 ${isGlassTheme(currentTheme) ? 'bg-white/50 border-white/40 placeholder:text-slate-500' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 placeholder:text-slate-400'}`}
                      />
                      {resetError && <p className="text-[10px] text-rose-600 font-bold">{resetError}</p>}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          if (isPinEnabled) {
                            import('../utils/parentLock').then(({ verifyParentPin }) => {
                              if (!verifyParentPin(resetPasswordInput)) {
                                setResetError('Incorrect PIN');
                                return;
                              }
                              onResetDemo();
                              setShowResetConfirm(false);
                              onClose();
                            });
                          } else {
                            if (resetPasswordInput.trim().toUpperCase() !== 'RESET') {
                              setResetError('Type RESET to confirm');
                              return;
                            }
                            onResetDemo();
                            setShowResetConfirm(false);
                            onClose();
                          }
                        }}""")
]

if os.path.exists('src/components/HouseSettingsModal.tsx'):
    replace_in_file('src/components/HouseSettingsModal.tsx', replacements)

