import os

filepath = 'src/components/Navigation.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    "className={`fixed bottom-0 ${forceMobileUi ? 'flex' : 'md:hidden'} left-0 right-0 z-30",
    "className={`${forceMobileUi ? 'block' : 'md:hidden'} fixed bottom-0 left-0 right-0 z-30"
)

# And max-w for the inner div to keep it centered on desktop
content = content.replace(
    '<div className="flex items-center justify-around h-12">',
    '<div className="flex items-center justify-around h-12 max-w-md mx-auto">'
)

with open(filepath, 'w') as f:
    f.write(content)
