
import React from 'react';
import {
  LayoutGrid,
  Settings,
  Shield,
  Zap,
  Terminal,
  Database
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
    { icon: <Shield className="w-5 h-5" />, label: 'Technology', id: 'tech' },
    { icon: <Database className="w-5 h-5" />, label: 'Tech Stack', id: 'tech-stack' },
    { icon: <Terminal className="w-5 h-5" />, label: 'AI Strategy', id: 'strategy' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 glass-panel border-r border-white/5 hidden lg:flex flex-col z-50">
      <div className="p-2xl flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-shadow-black border-2 border-[#FF7A00] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,122,0,0.3)]">
            <Shield className="w-6 h-6 text-[#FF7A00]" fill="currentColor" fillOpacity={0.1} />
          </div>
          <ShadowTypography variant="h3" className="text-white tracking-tighter uppercase font-black">
            Shadow<span className="text-[#FF7A00]">Agent</span>
          </ShadowTypography>
        </div>
        <p className="text-[10px] text-shadow-500 font-bold tracking-widest ml-14">USD1 PROTOCOL</p>
      </div>

      <nav className="flex-1 px-lg py-md space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-shadow-600 px-md py-4">Platform</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            className={`w-full flex items-center gap-md px-md py-3 rounded-lg transition-all duration-300 group cursor-pointer ${currentView === item.id
              ? 'bg-[#FF7A00]/5 text-[#FF7A00]'
              : 'text-shadow-500 hover:text-shadow-300 hover:bg-white/5'
              }`}
          >
            <span className={`transition-transform duration-300 group-hover:scale-110 ${currentView === item.id ? 'text-[#FF7A00]' : 'text-shadow-600'}`}>
              {item.icon}
            </span>
            <span className="text-sm font-bold tracking-wide">{item.label}</span>
            {currentView === item.id && <div className="ml-auto w-1 h-1 rounded-full bg-[#FF7A00] shadow-[0_0_8px_rgba(255,122,0,0.8)]" />}
          </button>
        ))}
      </nav>

      <div className="p-lg mt-auto space-y-md">
        <div className="p-md rounded-xl bg-gradient-to-br from-shadow-gray-900 to-shadow-black border border-shadow-gray-800 space-y-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-shadow-gold tracking-widest uppercase">System Status</span>
            <div className={`w-2 h-2 rounded-full ${isSimulationMode ? 'bg-[#FF7A00]' : 'bg-green-500'} animate-pulse`} />
          </div>
          <p className="text-xs text-shadow-400 font-medium">
            {isSimulationMode ? "Solana Devnet: Simulated" : "Solana Mainnet: Live"}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-md py-4 border-t border-shadow-gray-800">
          <div className="flex items-center justify-between text-shadow-500">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Status</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isSimulationMode ? 'bg-[#FF7A00]' : 'bg-green-500'} animate-pulse`} />
          </div>
          <p className="text-[8px] text-shadow-600 uppercase tracking-tighter">
            {isSimulationMode ? "Simulation Mode Active" : "Live Mainnet Protocol Active"}
          </p>
        </div>
      </div>
    </aside>
  );
};
