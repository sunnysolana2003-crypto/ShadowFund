import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import WalletConnect from './WalletConnect';
import AIStrategy from './AIStrategy';
import { WalletProvider } from './contexts/WalletProvider';
import { ShadowFundProvider, useShadowFund } from './contexts/ShadowFundContext';

// 🎬 DEMO MODE: Set to true to skip wallet connection (for presentations)
const DEMO_MODE = false;
const DEMO_WALLET = 'DEMO7xQai9wYgLbGSDjJxr3cFkQaQZ5uY2hZfGKpL7Wallet'; // Simulated demo wallet

// Inner app component that uses the context and wallet
const AppContent: React.FC = () => {
  const [view, setView] = useState<'landing' | 'wallet' | 'dashboard' | 'strategy'>('landing');
  const { connectWallet, fetchTreasury, fetchStrategy } = useShadowFund();
  const { disconnect } = useWallet();

  const handleWalletConnect = useCallback(async (walletAddress: string) => {
    console.log('[App] Wallet connected:', walletAddress);

    // Store real wallet address in context
    connectWallet(walletAddress);

    // Fetch initial data from backend with real wallet
    try {
      await Promise.all([
        fetchTreasury(),
        fetchStrategy()
      ]);
    } catch (error) {
      console.error('[App] Failed to fetch initial data:', error);
    }

    setView('dashboard');
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
