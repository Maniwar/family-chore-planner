import re

with open('src/components/Header.tsx', 'r') as f:
    content = f.read()

old_btn = r"""              <button
                onClick=\{\(\) => \{
                  soundFX\.playPop\(\);
                  if \(onOpenSyncModal\) onOpenSyncModal\(\);
                \}\}
                className=\{`p-1\.5 rounded-lg transition-colors cursor-pointer \$\{
                  householdInfo\.isCloudSynced
                    \? 'text-emerald-700 hover:bg-emerald-100/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                \}`\}
                title=\{householdInfo\.isCloudSynced \? `Cloud Synced \(\$\{householdInfo\.householdCode \|\| 'Live'\}\)` : 'Connect Multi-Family Cloud Sync'\}
              >
                \{householdInfo\.isCloudSynced \? \(
                  <CloudCheck className="w-3\.5 h-3\.5 text-emerald-600" />
                \) : \(
                  <Cloud className="w-3\.5 h-3\.5 text-sky-500" />
                \)\}
              </button>"""

new_btn = """              <button
                onClick={() => {
                  soundFX.playPop();
                  if (onOpenSyncModal) onOpenSyncModal();
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                  householdInfo.isCloudSynced
                    ? 'text-emerald-700 hover:bg-emerald-100/60'
                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200 shadow-xs border border-rose-200'
                }`}
                title={householdInfo.isCloudSynced ? `Cloud Synced (${householdInfo.householdCode || 'Live'})` : 'Connect Multi-Family Cloud Sync'}
              >
                {householdInfo.isCloudSynced ? (
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Not Syncing</span>
                  </>
                )}
              </button>"""
content = re.sub(old_btn, new_btn, content)

with open('src/components/Header.tsx', 'w') as f:
    f.write(content)
