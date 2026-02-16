import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import WalletConnect from './WalletConnect';
import AIStrategy from './AIStrategy';
import TechOverview from './TechOverview';
import TechStack from './TechStack';
import { WalletProvider } from './contexts/WalletProvider';
import { ShadowFundProvider, useShadowFund } from './contexts/ShadowFundContext';

// 🎬 Demo mode is controlled via environment flags elsewhere; keep routing deterministic here.

// Inner app component that uses the context and wallet
const AppContent: React.FC = () => {
  const [view, setView] = useState<'landing' | 'wallet' | 'dashboard' | 'strategy' | 'tech' | 'tech-stack'>('landing');
  const { connectWallet, fetchTreasury, fetchStrategy } = useShadowFund();
  const { disconnect } = useWallet();

  const handleWalletConnect = useCallback(async (walletAddress: string) => {
    connectWallet(walletAddress);
    setView('dashboard');
    try {
      await Promise.all([
        fetchTreasury(walletAddress),
        fetchStrategy()
      ]);
    } catch (_) {
      // Dashboard will refetch on mount if needed
    }
  }, [connectWallet, fetchTreasury, fetchStrategy]);

  // Auto-connect removed for production
  const handleEnter = useCallback(() => {
    setView('wallet');
  }, []);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setView('landing');
  }, [disconnect]);

  return (
    <>
      {view === 'landing' && (
        <LandingPage onEnter={handleEnter} />
      )}
      {view === 'wallet' && (
        <WalletConnect onConnect={handleWalletConnect} />
      )}
      {view === 'dashboard' && (
        <Dashboard
          onNavigate={(v) => setView(v as any)}
          currentView="dashboard"
          onDisconnect={handleDisconnect}
        />
      )}
      {view === 'strategy' && (
        <AIStrategy
          onNavigate={(v) => setView(v as any)}
          currentView="strategy"
        />
      )}
      {view === 'tech' && (
        <TechOverview
          onNavigate={(v) => setView(v as any)}
          currentView="tech"
        />
      )}
      {view === 'tech-stack' && (
        <TechStack
          onNavigate={(v) => setView(v as any)}
          currentView="tech-stack"
        />
      )}
    </>
  );
};

// Main App with all providers
const App: React.FC = () => {
  return (
    <WalletProvider>
      <ShadowFundProvider>
        <AppContent />
      </ShadowFundProvider>
    </WalletProvider>
  );
};

export default App;
