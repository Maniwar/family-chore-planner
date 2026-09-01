import os
import re

filepath = 'src/App.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add state
state_match = "const [currentTheme, setCurrentTheme] = useState<ThemePreset>"
state_insert = """  const [forceMobileUi, setForceMobileUi] = useState<boolean>(() => {
    try {
      return localStorage.getItem('family_chore_force_mobile') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMobileUi = () => {
    setForceMobileUi(prev => {
      const next = !prev;
      try {
        localStorage.setItem('family_chore_force_mobile', String(next));
      } catch {}
      return next;
    });
  };

"""

content = content.replace(state_match, state_insert + state_match)

# Add to Header
header_match = """        pendingInspectionCount={pendingInspectionCount}
        onLanguageChange={setLanguage}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}"""
header_replace = """        pendingInspectionCount={pendingInspectionCount}
        onLanguageChange={setLanguage}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        forceMobileUi={forceMobileUi}
        onToggleMobileUi={toggleMobileUi}"""

content = content.replace(header_match, header_replace)

# Add to Navigation
nav_match = """      {/* Navigation Tabs Bar */}
      <Navigation
        currentView={currentView}"""
nav_replace = """      {/* Navigation Tabs Bar */}
      <Navigation
        currentView={currentView}
        forceMobileUi={forceMobileUi}"""

content = content.replace(nav_match, nav_replace)


with open(filepath, 'w') as f:
    f.write(content)
