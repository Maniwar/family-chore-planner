with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    ".catch(console.warn)", 
    ".catch((err) => { showToast('Changes saved locally (Sync failed: ' + err.message + ')'); console.error('Sync error:', err); })"
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
