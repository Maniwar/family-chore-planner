import re

with open('src/components/HouseholdSyncModal.tsx', 'r') as f:
    content = f.read()

old_catch = r"""    \} catch \(err\) \{
      console\.error\('Failed to create household', err\);
      setErrorMessage\('Failed to create household\. Please check internet connection\.'\);
    \} finally \{"""

new_catch = """    } catch (err: any) {
      console.error('Failed to create household', err);
      setErrorMessage(err.message || 'Failed to create household. Please check internet connection.');
    } finally {"""
content = re.sub(old_catch, new_catch, content)

with open('src/components/HouseholdSyncModal.tsx', 'w') as f:
    f.write(content)
