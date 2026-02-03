import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Shield,
  TrendingUp,
  Eye,
  EyeOff,
  Activity,
  Zap,
  LockKeyhole,
  BarChart3,
  Brain,
  Sparkles,
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import { ShadowButton } from './components/ShadowButton';
import { ShadowCard } from './components/ShadowCard';
import { ShadowTypography } from './components/ShadowTypography';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useShadowFund } from './contexts/ShadowFundContext';

// Custom component for GSAP number transitions
const AnimatedValue: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = ({ value, prefix = "", suffix = "", decimals = 2 }) => {
  const elRef = useRef<HTMLSpanElement>(null);
  const count = useRef({ val: 0 });

  useEffect(() => {
    gsap.to(count.current, {
      val: value,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (elRef.current) {
          elRef.current.innerText = `${prefix}${count.current.val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
        }
      }
    });
  }, [value, prefix, suffix, decimals]);

  return <span ref={elRef}>{prefix}{value.toLocaleString()}{suffix}</span>;
};

const Dashboard: React.FC<{ onNavigate: (v: string) => void; currentView: string; onDisconnect?: () => void }> = ({ onNavigate, currentView }) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const {
    wallet,
    treasury,
    strategy,
    vaultStats,
    rebalance,
    isRebalancing,
    fetchTreasury,
    deposit,
    isDepositing,
    isWithdrawing,
    withdraw,
    isSimulationMode
  } = useShadowFund();

  // Live yield ticker simulation
  const [yieldTicker, setYieldTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate earning based on 10.8% APY on a small balance ticks
      setYieldTicker(p => p + (Math.random() * 0.00000005));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const totalBalance = treasury.data?.totalUSD1 ?? 0;
  const publicBalance = treasury.data?.publicBalance ?? 0;
  const vaultsData = treasury.data?.vaults ?? [];

  type VaultId = 'reserve' | 'yield' | 'growth' | 'degen';

  const vaultDisplayInfo: Record<string, { color: string; icon: React.ReactNode }> = {
    'reserve': { color: 'shadow-green', icon: <Shield className="w-4 h-4" /> },
    'yield': { color: 'shadow-gold', icon: <Zap className="w-4 h-4" /> },
    'growth': { color: 'white', icon: <TrendingUp className="w-4 h-4" /> },
    'degen': { color: 'shadow-error', icon: <Activity className="w-4 h-4" /> },
  };

  // Always render all 4 vaults (even if backend returns partial data).
  const vaultOrder: VaultId[] = ['reserve', 'yield', 'growth', 'degen'];
  const vaultById = new Map(vaultsData.map(v => [v.id, v]));

  const vaults = vaultOrder.map((id) => {
    const v = vaultById.get(id) ?? { id, address: id, balance: 0 };
    const targetAllocation = strategy.data?.allocation?.[id] ?? 0;
    return {
      ...v,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      allocation: totalBalance > 0 ? Math.round((v.balance / totalBalance) * 100) : 0,
      targetAllocation,
      ...vaultDisplayInfo[id],
    };
  });

  const handleRebalance = async () => {
    await rebalance();
  };

  const handleBridge = async () => {
    const amount = depositAmount ? parseFloat(depositAmount) : publicBalance;
    if (amount > 0 && amount <= publicBalance) {
      await deposit(amount);
      setDepositAmount('');
    }
  };

  const handleWithdraw = async () => {
    const amount = withdrawAmount ? parseFloat(withdrawAmount) : totalBalance;
    if (amount > 0 && amount <= totalBalance) {
      if (window.confirm(`Withdraw $${amount.toFixed(2)} to public wallet?`)) {
        await withdraw(amount);
        setWithdrawAmount('');
      }
    }
  };

  useEffect(() => {
    if (wallet.address) {
      fetchTreasury();
    }
  }, [wallet.address]);

  return (
    <div className="flex min-h-screen bg-shadow-black text-shadow-300 font-sans">
      <Sidebar onNavigate={onNavigate} currentView={currentView} />
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar currentView={currentView} onNavigate={onNavigate} />

        {/* Mode banner: always visible when simulation; shows USD1 zero-log and link to Technology */}
        {isSimulationMode && (
          <div className="bg-gradient-to-r from-shadow-purple/20 via-shadow-gold/20 to-shadow-purple/20 border-b border-shadow-purple/30">
            <div className="max-w-7xl mx-auto px-8 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-shadow-purple animate-pulse shrink-0" />
                  <p className="text-sm text-shadow-300">
                    <span className="font-bold text-shadow-purple">DEMO MODE</span> — Portfolio simulation active.
                    <span className="text-shadow-500 ml-2">USD1 zero-log • No amounts or wallets in logs.</span>
                  </p>
                </div>
                <ShadowButton variant="secondary" size="sm" onClick={() => onNavigate('tech')}>
                  Mainnet status & roadmap →
                </ShadowButton>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <ShadowTypography variant="h1" className="text-white mb-2">My Portfolio</ShadowTypography>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-shadow-green shadow-[0_0_8px_var(--shadow-green)]" />
                <span className="text-[10px] uppercase tracking-widest text-shadow-500 font-bold">Secure ZK-Node Connected</span>
                <span className="px-2 py-0.5 rounded-full bg-shadow-green/10 border border-shadow-green text-[8px] uppercase font-black text-shadow-green tracking-tighter">Mainnet Beta</span>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap items-center">
              <ShadowButton
                variant="secondary"
                icon={balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? 'Privacy Mode' : 'Show Balance'}
              </ShadowButton>
              <ShadowButton
                variant="primary"
                icon={isRebalancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                onClick={handleRebalance}
                disabled={isRebalancing || !wallet.address || totalBalance === 0}
              >
                {isRebalancing ? 'Optimizing...' : 'Optimize Portfolio'}
              </ShadowButton>
            </div>
          </header>

          {/* Core Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Primary Balance Area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Two-Column Balance Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Public USD1 Balance - Left Card */}
                <ShadowCard className="p-8 bg-gradient-to-br from-shadow-gray-900 to-shadow-black border-shadow-gold/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-shadow-gold/5 to-transparent pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-shadow-gold/20">
                          <Eye className="w-4 h-4 text-shadow-gold" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-shadow-500 uppercase tracking-widest">Public USD1</p>
                          <p className="text-[8px] text-shadow-gold uppercase tracking-tight">Visible On-Chain</p>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-shadow-gold/10 border border-shadow-gold/20 text-[8px] font-bold text-shadow-gold uppercase">
                        Exposed
                      </div>
                    </div>

                    <ShadowTypography variant="h2" className="text-white block text-3xl">
                      {balanceVisible ? `$${publicBalance.toFixed(2)}` : '••••••'}
                    </ShadowTypography>

                    {/* SOL Balance Display */}
                    <div className="flex items-center gap-2 mt-2 pb-2 border-b border-white/5">
                      <div className="p-1.5 rounded-md bg-white/5">
                        <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" className="w-3 h-3" alt="SOL" />
                      </div>
                      <div>
                        <p className="text-[10px] text-shadow-400 font-bold uppercase tracking-wide">Wallet SOL</p>
                        <p className="text-sm font-mono text-white">{balanceVisible ? `${wallet.solBalance.toFixed(4)} SOL` : '••• SOL'}</p>
                      </div>
                    </div>

                    {/* Shield Controls */}
                    <div className="space-y-4 pt-4">
                      <p className="text-[10px] font-bold text-shadow-500 uppercase tracking-widest">Shield Your USD1</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder={publicBalance > 0 ? `Max: ${publicBalance.toFixed(2)}` : 'No USD1'}
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="flex-1 bg-shadow-gray-900/50 border border-shadow-gold/20 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-shadow-gold/50 rounded-lg"
                          max={publicBalance}
                          min={0}
                          step="0.01"
                        />
                        <ShadowButton
                          variant="primary"
                          className="bg-shadow-gold/20 text-shadow-gold hover:bg-shadow-gold/30 border-shadow-gold/30"
                          icon={isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockKeyhole className="w-4 h-4" />}
                          onClick={handleBridge}
                          disabled={isDepositing || parseFloat(depositAmount || '0') < 0.01 || (depositAmount ? parseFloat(depositAmount) > publicBalance : false)}
                        >
                          {isDepositing ? 'Shielding...' : 'Shield →'}
                        </ShadowButton>
                      </div>
                      {depositAmount && parseFloat(depositAmount) < 0.01 && (
                        <p className="text-[10px] text-shadow-error font-bold flex items-center gap-1">
                          <Info className="w-3 h-3" /> Min Deposit: 0.01 USD1 (Testing)
                        </p>
                      )}
                      {publicBalance === 0 && (
                        <p className="text-[10px] text-shadow-500 italic">Get USD1 on Jupiter to start shielding.</p>
                      )}
                    </div>
                  </div>
                </ShadowCard>

                {/* Shielded Balance - Right Card */}
                <ShadowCard className="p-8 bg-gradient-to-br from-shadow-gray-900 to-shadow-black border-shadow-green/20 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-shadow-green/5 to-transparent pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-shadow-green/20">
                          <Shield className="w-4 h-4 text-shadow-green" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-shadow-500 uppercase tracking-widest">Shielded Balance</p>
                          <p className="text-[8px] text-shadow-green uppercase tracking-tight">Private Portfolio</p>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-shadow-green/10 border border-shadow-green/20 text-[8px] font-bold text-shadow-green uppercase">
                        Protected
                      </div>
                    </div>

                    <ShadowTypography variant="h2" className="text-white block text-3xl">
                      {balanceVisible ? <AnimatedValue value={totalBalance} prefix="$" /> : '••••••'}
                    </ShadowTypography>

                    {treasury.loading && <p className="text-xs text-shadow-green animate-pulse">Updating from ShadowWire...</p>}

                    {/* Yield Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-shadow-600 uppercase mb-1">Yield Earned</p>
                        <p className={`text-lg font-display ${(vaultStats.data?.yield?.earnedYield ?? 0) > 0 ? 'text-shadow-green' : 'text-shadow-400'}`}>
                          {balanceVisible
                            ? `+$${(vaultStats.data?.yield?.earnedYield ?? 0).toFixed(2)}`
                            : '•••••'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-shadow-600 uppercase mb-1">Active APY</p>
                        <p className="text-lg font-display text-white">
                          {vaultStats.data?.yield?.apy
                            ? `${vaultStats.data.yield.apy.toFixed(1)}%`
                            : '--.--%'}
                        </p>
                      </div>
                    </div>

                    {/* Unshield Control */}
                    {totalBalance > 0 && (
                      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <input
                          type="number"
                          placeholder={`Max: ${totalBalance.toFixed(2)}`}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="flex-1 bg-shadow-gray-900/50 border border-shadow-error/20 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-shadow-error/50 rounded-lg"
                          max={totalBalance}
                          min={0}
                          step="0.01"
                        />
                        <ShadowButton
                          variant="secondary"
                          className="bg-shadow-error/10 text-shadow-error hover:bg-shadow-error/20 border-shadow-error/20"
                          icon={isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                          onClick={handleWithdraw}
                          disabled={isWithdrawing || (withdrawAmount ? parseFloat(withdrawAmount) > totalBalance : false)}
                        >
                          {isWithdrawing ? 'Unshielding...' : 'Unshield'}
                        </ShadowButton>
                      </div>
                    )}
                  </div>
                </ShadowCard>
              </div>

              {/* Vaults Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vaults.map((vault) => (
                  <ShadowCard key={vault.id} className="p-8 border-white/5 bg-shadow-black hover:border-white/10 transition-colors relative overflow-hidden group">
                    {/* Background Gradient based on vault color */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-${vault.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded bg-${vault.color}/10 text-${vault.color}`}>
                            {vault.icon}
                          </div>
                          <div>
                            <ShadowTypography variant="h4" className="text-white">{vault.name}</ShadowTypography>
                            <p className="text-[10px] text-shadow-500 uppercase tracking-wide">{vault.id === 'yield' ? 'Kamino Lending' : vault.id === 'growth' ? 'Jupiter Aggregator' : vault.id === 'degen' ? 'DexScreener + Jupiter' : 'ShadowWire Reserve'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-display text-white">{vault.allocation}%</p>
                          <p className="text-sm font-bold text-shadow-green">${vault.balance.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-1">
                            <span className="text-shadow-500">Allocation Target</span>
                            <span className={vault.allocation === vault.targetAllocation ? "text-shadow-green" : "text-shadow-gold"}>
                              {vault.targetAllocation}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${vault.targetAllocation}%` }}
                              className={`h-full bg-${vault.color} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                            />
                          </div>
                        </div>

                        {/* GRANULAR VAULT DETAILS */}
                        <div className="pt-4 border-t border-white/5 min-h-[60px]">

                          {/* YIELD VAULT: Live Ticker */}
                          {vault.id === 'yield' && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-shadow-400">Yield Accruing</span>
                                <span className="text-shadow-green font-mono font-bold animate-pulse">Live</span>
                              </div>
                              <div className="bg-black/40 rounded p-2 flex items-center justify-between">
                                <span className="text-[10px] text-shadow-500 uppercase">Unclaimed</span>
                                <span className="text-shadow-green font-mono">
                                  +${((vaultStats.data?.yield?.earnedYield || 0) + yieldTicker).toFixed(8)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* DEGEN VAULT: Active Plays */}
                          {vault.id === 'degen' && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-shadow-400">Active Plays</span>
                                <span className="text-shadow-gold text-[10px] uppercase">High Risk</span>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {(vaultStats.data?.degen?.positions?.length ? vaultStats.data.degen.positions : [
                                  { token: { symbol: 'WIF' }, pnlPercent: 12.5 },
                                  { token: { symbol: 'BONK' }, pnlPercent: -2.1 }
                                ]).map((pos: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1 shrink-0 border border-white/5">
                                    <span className="text-[10px] font-bold text-white">{pos.token.symbol}</span>
                                    <span className={`text-[9px] font-mono ${pos.pnlPercent >= 0 ? 'text-shadow-green' : 'text-shadow-error'}`}>
                                      {pos.pnlPercent > 0 ? '+' : ''}{pos.pnlPercent}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* GROWTH VAULT: Composition */}
                          {vault.id === 'growth' && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-shadow-400">Composition</span>
                                <span className="text-shadow-blue text-[10px] uppercase">Heavily Weighted</span>
                              </div>
                              <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
                                <div className="h-full bg-[#9945FF] w-[50%]" title="SOL" />
                                <div className="h-full bg-[#F7931A] w-[20%]" title="BTC" />
                                <div className="h-full bg-[#627EEA] w-[30%]" title="ETH" />
                              </div>
                              <div className="flex justify-between text-[9px] text-shadow-500 font-mono">
                                <span>SOL 50%</span>
                                <span>BTC 20%</span>
                                <span>ETH 30%</span>
                              </div>
                            </div>
                          )}

                          {/* RESERVE VAULT: Status */}
                          {vault.id === 'reserve' && (
                            <div className="flex items-center justify-between h-full pt-1">
                              <div className="bg-shadow-green/10 px-2 py-1 rounded border border-shadow-green/20">
                                <span className="text-[10px] text-shadow-green uppercase tracking-wide font-bold">● Ready to Deploy</span>
                              </div>
                              <span className="text-[10px] text-shadow-400">{vault.allocation}% Cash</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </ShadowCard>
                ))}
              </div>
            </div>

            {/* AI Reasoning Side Panel */}
            <div className="lg:col-span-4 space-y-8">
              <ShadowCard className="p-8 border-shadow-green/20 bg-shadow-green/[0.02]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-shadow-green/20 rounded-lg">
                    <Brain className="w-5 h-5 text-shadow-green" />
                  </div>
                  <ShadowTypography variant="h4" className="text-white">AI Reasoning</ShadowTypography>
                </div>

                <div className="space-y-8">
                  <div className="p-4 rounded-lg bg-shadow-black border border-white/5">
                    <p className="text-xs text-shadow-400 leading-relaxed italic mb-4">
                      "{strategy.data?.reasoning || "Analyzing market conditions to provide optimal allocation advice..."}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-shadow-600 border-t border-white/5 pt-4">
                      <span>Gemini 3 Flash Preview</span>
                      <span>Confidence: {strategy.data?.confidence ?? '--'}%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-shadow-500 uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3 h-3" /> Key Strategic Insights
                    </p>
                    <div className="space-y-sm">
                      {strategy.data?.keyInsights?.map((insight, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <span className="text-shadow-green font-mono">{i + 1}.</span>
                          <span className="text-shadow-400">{insight}</span>
                        </div>
                      )) || <p className="text-xs text-shadow-600 italic">Acquiring market signals...</p>}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-shadow-500 uppercase">Market Mood</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${strategy.data?.mood === 'risk-on' ? 'bg-shadow-green/20 text-shadow-green' :
                        strategy.data?.mood === 'risk-off' ? 'bg-shadow-error/20 text-shadow-error' :
                          'bg-white/10 text-shadow-400'
                        }`}>
                        {strategy.data?.mood || 'Neutral'}
                      </span>
                    </div>
                    <p className="text-xs text-shadow-500 leading-snug">
                      {strategy.data?.marketAnalysis || "Market signals are consistent with current positioning."}
                    </p>
                  </div>
                </div>
              </ShadowCard>

              {/* Secure Node Status */}
              <ShadowCard className="p-8 border-white/5 bg-shadow-black">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-full">
                    <Shield className="w-6 h-6 text-shadow-green" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-widest uppercase">ShadowWire ZK</p>
                    <p className="text-[10px] text-shadow-600 font-mono">Proof: 0x4f...ZK72</p>
                  </div>
                  <div className="ml-auto">
                    <div className="px-3 py-1 bg-shadow-green/10 border border-shadow-green/20 rounded text-[10px] font-mono text-shadow-green">
                      VERIFIED
                    </div>
                  </div>
                </div>
              </ShadowCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
