import re
import os

filepath = 'src/components/HouseSettingsModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add state variables
content = content.replace("const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);",
                          "const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);\n  const [resetPasswordInput, setResetPasswordInput] = useState<string>('');\n  const [resetError, setResetError] = useState<string>('');")

# Modify onClick
old_onclick = """onClick={() => {
                        soundFX.playPop();
                        setShowResetConfirm(true);
                      }}"""
new_onclick = """onClick={() => {
                        soundFX.playPop();
                        setShowResetConfirm(true);
                        setResetPasswordInput('');
                        setResetError('');
                      }}"""
content = content.replace(old_onclick, new_onclick)

# Find the showResetConfirm block
import re

old_block = r"""\{showResetConfirm && \(\s*<div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 animate-in fade-in">\s*<p className="text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">\s*<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />\s*<span>Are you sure\? This restores sample data on this device\.</span>\s*</p>\s*<div className="flex items-center gap-2 pt-1">\s*<button\s*type="button"\s*onClick=\{\(\) => \{\s*soundFX\.playPop\(\);\s*onResetDemo\(\);\s*setShowResetConfirm\(false\);\s*onClose\(\);\s*\}\}"""

new_block = """{showResetConfirm && (
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
                        onClick={async () => {
                          soundFX.playPop();
                          if (isPinEnabled) {
                            const { verifyParentPin } = await import('../utils/parentLock');
                            if (!verifyParentPin(resetPasswordInput)) {
                              setResetError('Incorrect PIN');
                              return;
                            }
                            onResetDemo();
                            setShowResetConfirm(false);
                            onClose();
                          } else {
                            if (resetPasswordInput.trim().toUpperCase() !== 'RESET') {
                              setResetError('Type RESET to confirm');
                              return;
                            }
                            onResetDemo();
                            setShowResetConfirm(false);
                            onClose();
                          }
                        }}"""
content = re.sub(old_block, new_block, content, flags=re.MULTILINE)

with open(filepath, 'w') as f:
    f.write(content)
