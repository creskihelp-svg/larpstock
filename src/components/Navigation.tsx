import React from 'react';
import { LayoutDashboard, Boxes, Zap, History, Users, Sliders } from 'lucide-react';

export type TabType = 'dashboard' | 'inventory' | 'record-sale' | 'sales-history' | 'team' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  lowStockCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory' as TabType, label: 'Inventory (23)', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'record-sale' as TabType, label: 'Record Sale', icon: Zap, highlight: true },
    { id: 'sales-history' as TabType, label: 'Sales History', icon: History },
    { id: 'team' as TabType, label: 'Team', icon: Users },
    { id: 'settings' as TabType, label: 'Settings', icon: Sliders },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            if (tab.highlight) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap shadow-md ${
                    isActive
                      ? 'bg-[#00ff41] text-black glow-green font-black scale-[1.02]'
                      : 'bg-emerald-950/70 text-[#00ff41] hover:bg-emerald-900/80 border border-emerald-500/50'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isActive ? 'fill-black' : 'fill-[#00ff41]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-600 shadow-md font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00ff41]' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>

                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-[-9px] inset-x-2 h-0.5 bg-[#00ff41] rounded-full glow-green-sm" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#090b0d]/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                    isActive
                      ? 'bg-[#00ff41] text-black scale-110 glow-green'
                      : 'bg-emerald-500 text-black border-2 border-black'
                  }`}
                >
                  <Zap className="w-6 h-6 fill-black" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">Sale</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition cursor-pointer relative ${
                isActive ? 'text-[#00ff41] font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
                {tab.id === 'record-sale' ? 'Sale' : tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
