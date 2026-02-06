
import React, { useState } from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { useShadowFund } from '../contexts/ShadowFundContext';

interface NavbarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { runtimeMode, setRuntimeMode } = useShadowFund();
  const navItems = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'strategy', label: 'AI' },
    { id: 'tech', label: 'Technology' },
    { id: 'tech-stack', label: 'Stack' },
  ];

  return (
    <header className="glass-panel border-b border-white/5 sticky top-0 z-40">
      <div className="h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex-1 max-w-xl hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-shadow-600" />
            <input
              type="text"
              placeholder="Search transactions, vaults, or assets..."
              className="w-full bg-shadow-black/50 border border-shadow-gray-800 rounded-full py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-shadow-green/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button className="p-sm text-shadow-500 hover:text-shadow-green transition-colors relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-shadow-error rounded-full" />
          </button>
          <div className="relative">
            <button
              className="p-sm text-shadow-500 hover:text-shadow-gold transition-colors"
              aria-label="Settings"
              onClick={() => setSettingsOpen((prev) => !prev)}
            >
              <Settings className="w-5 h-5" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-shadow-black/95 backdrop-blur-md shadow-xl p-4 z-50">
                <div className="text-[10px] uppercase tracking-widest text-shadow-500 mb-3">Environment</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRuntimeMode("demo");
                      setSettingsOpen(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      runtimeMode === "demo"
                        ? "bg-shadow-green/15 text-shadow-green border-shadow-green/30"
                        : "bg-white/0 text-shadow-500 border-white/10 hover:border-white/20 hover:text-shadow-300"
                    }`}
                  >
                    Demo
                  </button>
                  <button
                    onClick={() => {
                      setRuntimeMode("real");
                      setSettingsOpen(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      runtimeMode === "real"
                        ? "bg-shadow-gold/15 text-shadow-gold border-shadow-gold/30"
                        : "bg-white/0 text-shadow-500 border-white/10 hover:border-white/20 hover:text-shadow-300"
                    }`}
                  >
                    Real
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-shadow-500 leading-relaxed">
                  Real mode requires backend env <span className="text-shadow-300 font-semibold">SHADOWWIRE_MOCK=false</span>
                  {" "}and funded wallets where applicable.
                </p>
              </div>
            )}
          </div>
          <div className="h-6 w-[1px] bg-shadow-gray-800 mx-1" />
          <div className="flex items-center gap-sm bg-shadow-gray-900 border border-shadow-gray-800 py-1.5 px-3 rounded-lg">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-shadow-green to-shadow-gold flex items-center justify-center text-[10px] font-bold text-shadow-black">
              AV
            </div>
            <span className="text-xs font-mono font-medium hidden sm:inline">0x71...3f2c</span>
          </div>
        </div>
      </div>

      {/* Mobile navigation (since sidebar is desktop-only) */}
      {onNavigate && (
        <nav className="md:hidden flex gap-2 px-6 pb-md overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                  active
                    ? 'bg-shadow-green/10 text-shadow-green border-shadow-green/20'
                    : 'bg-white/0 text-shadow-500 border-white/10 hover:border-white/20 hover:text-shadow-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
