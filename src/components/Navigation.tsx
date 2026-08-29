import React from 'react';
import { 
  CalendarDays, 
  Activity,
  CalendarRange, 
  Sparkles, 
  Award, 
  Gift,
  ListTodo, 
  Users, 
  Printer, 
  Calendar,
  Settings
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
  behindCount?: number;
  overdueStatusCount?: number;
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
  behindCount = 0,
  overdueStatusCount = 0,
  isMomMode = true,
  language = 'en',
  currentTheme = 'rose',
}) => {
  const t = getTranslation(language);
  const theme = THEMES[currentTheme] || THEMES.rose;
  const effectiveBehindCount = overdueStatusCount || behindCount || 0;

  const handleSelect = (v: ViewMode) => {
    soundFX.playPop();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(12); } catch {}
    }
    if (onSelectView) onSelectView(v);
    if (onViewChange) onViewChange(v);
  };

  // Base navigation items with Mom/Admin vs Kid filtering
  const allNavItems = [
    {
      id: 'today' as ViewMode,
      label: "Today's Schedule",
      icon: CalendarDays,
      adminOnly: false,
    },
    {
      id: 'weekly' as ViewMode,
      label: 'Weekly Schedule',
      icon: CalendarRange,
      adminOnly: false,
    },
    {
      id: 'status' as ViewMode,
      label: 'Status & Ledger',
      icon: Activity,
      badge: effectiveBehindCount > 0 ? effectiveBehindCount : null,
      badgeColor: 'bg-rose-500 text-white',
      adminOnly: false,
    },
    {
      id: 'inspection' as ViewMode,
      label: t.tabInspect,
      icon: Sparkles,
      badge: pendingInspectionCount > 0 ? pendingInspectionCount : null,
      badgeColor: 'bg-amber-500 text-white',
      adminOnly: true, // Only Mom inspects chores
    },
    {
      id: 'rewards' as ViewMode,
      label: t.tabRewards,
      icon: Award,
      badge: null,
      badgeColor: 'bg-emerald-500 text-white',
      adminOnly: false,
    },
    {
      id: 'redemptions' as ViewMode,
      label: 'Redemptions',
      icon: Gift,
      badge: pendingRewardCount > 0 ? pendingRewardCount : null,
      badgeColor: 'bg-amber-500 text-white',
      adminOnly: false,
    },
    {
      id: 'library' as ViewMode,
      label: t.tabLibrary,
      icon: ListTodo,
      adminOnly: true,
    },
    {
      id: 'members' as ViewMode,
      label: isMomMode ? t.tabMembers : 'Family Stars 🌟',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'calendar' as ViewMode,
      label: t.tabCalendar,
      icon: Calendar,
      adminOnly: false,
    },
    {
      id: 'reports' as ViewMode,
      label: t.tabReports,
      icon: Printer,
      adminOnly: false,
    },
  ];

  const desktopNavItems = allNavItems.filter(item => !item.adminOnly || isMomMode);

  // iOS Fixed Tab Navigation for Mobile (Ranked strictly by primary workflows)
  const iosMobileTabs = isMomMode
    ? [
        { id: 'today' as ViewMode, label: 'Today', icon: CalendarDays },
        { id: 'weekly' as ViewMode, label: 'Schedule', icon: CalendarRange },
        { id: 'status' as ViewMode, label: 'Status', icon: Activity, badge: effectiveBehindCount },
        { id: 'inspection' as ViewMode, label: 'Inspect', icon: Sparkles, badge: pendingInspectionCount },
        { id: 'rewards' as ViewMode, label: 'Rewards', icon: Award, badge: pendingRewardCount },
      ]
    : [
        { id: 'today' as ViewMode, label: 'Today', icon: CalendarDays },
        { id: 'weekly' as ViewMode, label: 'Schedule', icon: CalendarRange },
        { id: 'status' as ViewMode, label: 'Status', icon: Activity, badge: effectiveBehindCount },
        { id: 'rewards' as ViewMode, label: 'Rewards', icon: Award, badge: pendingRewardCount },
      ];

  return (
    <>
      {/* Desktop Navigation Header Bar */}
      <div className={`${theme.navBg} border-b ${theme.navBorder} no-print hidden md:block sticky top-[57px] sm:top-[65px] z-20 shadow-2xs transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-1.5 sm:py-2" aria-label="Tabs">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap relative shrink-0 active:scale-95 cursor-pointer min-h-[44px] ${
                    isActive
                      ? `${theme.navActiveBg} ${theme.navActiveText}`
                      : `${theme.navInactiveText} ${theme.navHoverBg}`
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
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

      {/* iOS HIG Fixed Bottom Tab Bar for Mobile (No Hamburger, No Dropdowns) */}
      <nav 
        id="ios-bottom-tab-bar"
        aria-label="Bottom Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg px-2 pt-1 safe-area-pb select-none"
      >
        <div className="flex items-center justify-around h-12">
          {iosMobileTabs.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-bottom-nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`flex-1 h-full flex flex-col items-center justify-center relative rounded-xl transition-all active:scale-90 cursor-pointer min-h-[44px] touch-target ${
                  isActive ? `${theme.badgeText} font-bold` : 'text-slate-500 font-medium hover:text-slate-700'
                }`}
                title={item.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.75px]'}`} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] leading-tight mt-1 tracking-tight truncate max-w-[70px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

