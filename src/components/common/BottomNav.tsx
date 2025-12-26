import { ClipboardList, BarChart3, PenSquare } from 'lucide-react';

export type TabType = 'log' | 'history' | 'stats';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface NavTab {
  id: TabType;
  label: string;
  icon: typeof PenSquare;
}

const tabs: NavTab[] = [
  {
    id: 'log',
    label: 'Log',
    icon: PenSquare,
  },
  {
    id: 'history',
    label: 'History',
    icon: ClipboardList,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: BarChart3,
  },
];

/**
 * Bottom navigation bar for module switching between Log, History, and Stats tabs.
 * Handles iOS safe area insets for devices with home indicators.
 */
export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 min-h-16 py-2
                transition-colors
                ${
                  isActive
                    ? 'text-indigo-600'
                    : 'text-gray-600 active:text-gray-900'
                }
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`}
              />
              <span
                className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
