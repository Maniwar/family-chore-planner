import re

with open('src/components/ChoreCard.tsx', 'r') as f:
    content = f.read()

# Make sure BottomSheetGrabber is imported
if 'BottomSheetGrabber' not in content:
    content = content.replace("import { Avatar }", "import { Avatar }\nimport { BottomSheetGrabber }")
    if 'BottomSheetGrabber' not in content:
        content = content.replace("import { Clock", "import { BottomSheetGrabber }\nimport { Clock")


content = re.sub(
    r'\{/\* iOS Grabber for Mobile \*/\}\s*<div className="w-12 h-1\.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />',
    r'''{/* iOS Grabber for Mobile */}
          <div className="shrink-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 bg-white/10 dark:bg-black/10 rounded-t-3xl sm:hidden">
            <BottomSheetGrabber onClose={() => setShowDetails(false)} variant={isGlassTheme(currentTheme) ? 'white' : 'default'} />
          </div>''',
    content
)

with open('src/components/ChoreCard.tsx', 'w') as f:
    f.write(content)

