with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    ".catch(console.warn);", 
    ".catch(err => { console.warn('Sync warning:', err); showToast('Sync failed: ' + err.message); });"
)

content = content.replace(" || 'household_default'", "")

with open('src/App.tsx', 'w') as f:
    f.write(content)
