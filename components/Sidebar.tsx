
import React from 'react';
import {
  LayoutGrid,
  Settings,
  Shield,
  Zap,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import { ShadowTypography } from './ShadowTypography';
import { useShadowFund } from '../contexts/ShadowFundContext';

interface SidebarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView = 'dashboard', onNavigate }) => {
  const { isSimulationMode } = useShadowFund();
  const menuItems = [
    { icon: <LayoutGrid className="w-5 h-5" />, label: 'Overview', id: 'dashboard' },
    { icon: <Terminal className="w-5 h-5" />, label: 'AI Strategy', id: 'strategy' },
    { icon: <Cpu className="w-5 h-5" />, label: 'Technology', id: 'tech' },
    { icon: <Layers className="w-5 h-5" />, label: 'Tech Stack', id: 'tech-stack' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 glass-panel border-r border-white/5 hidden lg:flex flex-col z-50">
      <div className="p-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-shadow-black border-2 border-shadow-green flex items-center justify-center rounded-sm glow-green">
          <Shield className="w-6 h-6 text-shadow-green" fill="currentColor" fillOpacity={0.1} />
        </div>
        <ShadowTypography variant="h3" className="text-white tracking-tighter uppercase font-black">
          Shadow<span className="text-shadow-green">Fund</span>
        </ShadowTypography>
      </div>

      <nav className="flex-1 px-6 py-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-shadow-600 px-md py-4">Financial Dashboard</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className={`w-full flex items-center gap-4 px-md py-3 rounded-lg transition-all duration-300 group cursor-pointer ${currentView === item.id
              ? 'bg-shadow-green/5 text-shadow-green'
              : 'text-shadow-500 hover:text-shadow-300 hover:bg-white/5'
              }`}
          >
            <span className={`transition-transform duration-300 group-hover:scale-110 ${currentView === item.id ? 'text-shadow-green' : 'text-shadow-600'}`}>
              {item.icon}
            </span>
            <span className="text-sm font-bold tracking-wide">{item.label}</span>
            {currentView === item.id && <div className="ml-auto w-1 h-1 rounded-full bg-shadow-green shadow-[0_0_8px_var(--shadow-green)]" />}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-shadow-gray-900 to-shadow-black border border-shadow-gray-800 space-y-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-shadow-gold tracking-widest uppercase">Premium Tier</span>
            <Zap className="w-3 h-3 text-shadow-gold" />
          </div>
          <p className="text-xs text-shadow-400 font-medium">Unlocked: Infinite Liquidity access</p>
          <div className="w-full h-1 bg-shadow-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-shadow-gold w-3/4 shadow-[0_0_10px_rgba(197,160,89,0.3)]" />
          </div>
        </div>

        <div className="space-y-2 px-md py-4 border-t border-shadow-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-shadow-green" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-shadow-500">Live Node Connected</span>
            </div>
            <Settings className="w-4 h-4 text-shadow-700 hover:text-shadow-300 transition-colors cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-shadow-600">Mode</span>
            <span className={`text-[9px] font-bold uppercase ${isSimulationMode ? 'text-shadow-gold' : 'text-shadow-green'}`}>
              {isSimulationMode ? 'Simulation' : 'Mainnet-ready'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
