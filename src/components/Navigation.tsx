import React from 'react';
import { 
  CalendarDays, 
  CalendarRange, 
  Sparkles, 
  Award, 
  ListTodo, 
  Users, 
  Printer, 
  Calendar
} from 'lucide-react';
import { ViewMode } from '../types';
import { soundFX } from '../utils/audio';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import { ThemePreset, THEMES } from '../utils/theme';

interface NavigationProps {
  currentView: ViewMode;
  onSelectView?: (view: ViewMode) => void;
  onViewChange?: (view: ViewMode) => void;
  pendingInspectionCount?: number;
  pendingRewardCount?: number;
  isMomMode?: boolean;
  language?: SupportedLanguage;
  currentTheme?: ThemePreset;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  onViewChange,
  pendingInspectionCount = 0,
  pendingRewardCount = 0,
  language = 'en',
  currentTheme = 'rose',
}) => {
  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;

  const handleSelect = (v: ViewMode) => {
    soundFX.playPop();
    if (onSelectView) onSelectView(v);
    if (onViewChange) onViewChange(v);
  };

  const navItems = [
    {
      id: 'today' as ViewMode,
      label: t.tabToday,
      icon: CalendarDays,
    },
    {
      id: 'weekly' as ViewMode,
      label: t.tabWeekly,
      icon: CalendarRange,
    },
    {
      id: 'inspection' as ViewMode,
      label: t.tabInspect,
      icon: Sparkles,
      badge: pendingInspectionCount > 0 ? pendingInspectionCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'rewards' as ViewMode,
      label: t.tabRewards,
      icon: Award,
      badge: pendingRewardCount > 0 ? pendingRewardCount : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'library' as ViewMode,
      label: t.tabLibrary,
      icon: ListTodo,
    },
    {
      id: 'members' as ViewMode,
      label: t.tabMembers,
      icon: Users,
    },
    {
      id: 'calendar' as ViewMode,
      label: t.tabCalendar,
      icon: Calendar,
    },
    {
      id: 'reports' as ViewMode,
      label: t.tabReports,
      icon: Printer,
    },
  ];

  return (
    <div className={`${theme.navBg} border-b ${theme.navBorder} no-print overflow-x-auto scrollbar-none sticky top-[57px] sm:top-[65px] z-20 shadow-2xs transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 py-1.5 sm:py-2" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap relative shrink-0 active:scale-95 cursor-pointer ${
                  isActive
                    ? `${theme.navActiveBg} ${theme.navActiveText}`
                    : `${theme.navInactiveText} ${theme.navHoverBg}`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                <span>{item.label}</span>

                {item.badge && (
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <div className={`absolute bottom-0 left-2 right-2 h-0.5 ${theme.navIndicator} rounded-full`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
