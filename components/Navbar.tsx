
import React from 'react';
import { Bell, Search, Settings, Wallet } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="h-20 glass-panel border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-lg md:px-2xl">
      <div className="flex-1 max-w-xl hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-shadow-600" />
          <input 
            type="text" 
            placeholder="Search transactions, vaults, or assets..." 
            className="w-full bg-shadow-black/50 border border-shadow-gray-800 rounded-full py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-[#FF7A00]/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-md ml-auto">
        <button className="p-sm text-shadow-500 hover:text-[#FF7A00] transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-shadow-error rounded-full" />
        </button>
        <button className="p-sm text-shadow-500 hover:text-shadow-gold transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="h-6 w-[1px] bg-shadow-gray-800 mx-1" />
        <div className="flex items-center gap-sm bg-shadow-gray-900 border border-shadow-gray-800 py-1.5 px-3 rounded-lg">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#FF7A00] to-shadow-gold flex items-center justify-center text-[10px] font-bold text-shadow-black">
            AV
          </div>
          <span className="text-xs font-mono font-medium hidden sm:inline">0x71...3f2c</span>
        </div>
      </div>
    </header>
  );
};
