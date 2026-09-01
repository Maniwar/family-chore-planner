import os

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    '<main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 sm:pb-8">',
    '<main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 ${forceMobileUi ? "sm:pb-28" : "sm:pb-8"}`}>'
)

with open(filepath, 'w') as f:
    f.write(content)
