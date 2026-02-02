import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Brain,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Gauge
} from 'lucide-react';
import { ShadowTypography } from './components/ShadowTypography';
import { ShadowCard } from './components/ShadowCard';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useShadowFund } from './contexts/ShadowFundContext';

const AIStrategy: React.FC<{ onNavigate: (v: string) => void; currentView: string }> = ({ onNavigate, currentView }) => {
  const { strategy, fetchStrategy } = useShadowFund();

  useEffect(() => {
    fetchStrategy();
  }, []);

  const signals = strategy.data?.signals;

  return (
    <div className="flex min-h-screen bg-shadow-black text-shadow-300 font-sans">
      <Sidebar onNavigate={onNavigate} currentView={currentView} />
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar />

        <div className="p-xl md:p-2xl space-y-xl max-w-7xl mx-auto w-full">
          {/* Header */}
          <header className="space-y-2">
            <ShadowTypography variant="h1" className="text-white">AI Strategy Engine</ShadowTypography>
            <p className="text-shadow-500 font-medium">Deep analysis of Solana market signals via Gemini 3 Flash Preview.</p>
          </header>

          {/* Signals Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            <SignalCard
              label="SOL Trend"
              value={signals?.solTrend || '...'}
              icon={signals?.solTrend === 'bullish' ? <TrendingUp className="text-[#FF7A00]" /> : <TrendingDown className="text-shadow-error" />}
            />
            <SignalCard
              label="SOL RSI"
              value={signals?.solRSI?.toFixed(1) || '...'}
              icon={<Gauge className="text-shadow-gold" />}
              subValue={signals && (signals.solRSI < 30 ? "Oversold" : signals.solRSI > 70 ? "Overbought" : "Neutral")}
            />
            <SignalCard
              label="Volatility"
              value={signals?.volatility || '...'}
              icon={<Activity className="text-white" />}
            />
            <SignalCard
              label="Meme Hype"
              value={signals?.memeHype || '...'}
              icon={<Zap className="text-shadow-gold" />}
            />
          </section>

          {/* Analysis & Reasoning Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            {/* Deep Analysis */}
            <ShadowCard className="lg:col-span-12 p-2xl bg-gradient-to-br from-shadow-gray-900 to-shadow-black border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-lg opacity-10 pointer-events-none">
                <Brain className="w-64 h-64 text-[#FF7A00]" />
              </div>

              <div className="relative z-10 space-y-xl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-xl">
                  <div className="p-4 rounded-2xl bg-[#FF7A00]/10">
                    <Sparkles className="w-8 h-8 text-[#FF7A00]" />
                  </div>
                  <div>
                    <ShadowTypography variant="h3" className="text-white">Gemini Market Analysis</ShadowTypography>
                    <p className="text-xs text-shadow-600 font-mono uppercase tracking-widest mt-1">Status: Live Intelligence Feed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2xl">
                  <div className="space-y-lg">
                    <p className="text-[10px] font-bold text-shadow-500 uppercase tracking-[0.3em]">AI Summary</p>
                    <p className="text-xl text-white font-medium leading-relaxed">
                      {strategy.data?.marketAnalysis || "Awaiting signals from the Solana mainnet..."}
                    </p>
                    <div className="p-xl rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-sm font-bold text-[#FF7A00] mb-3 uppercase tracking-widest">Strategic Logic</p>
                      <p className="text-sm text-shadow-400 leading-relaxed italic">
                        "{strategy.data?.reasoning || "Calculating optimal yield-to-risk vector based on current volatility coefficients..."}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-lg">
                    <p className="text-[10px] font-bold text-shadow-500 uppercase tracking-[0.3em]">Execution Insights</p>
                    <div className="space-y-md">
                      {strategy.data?.keyInsights?.map((insight, i) => (
                        <div key={i} className="flex gap-4 p-lg rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00] font-mono text-sm shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm text-shadow-300 leading-snug">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ShadowCard>

            {/* Performance Correlation */}
            <ShadowCard className="lg:col-span-8 p-xl">
              <div className="flex items-center justify-between mb-xl">
                <ShadowTypography variant="h4" className="text-white">Risk Profile Correlation</ShadowTypography>
                <Shield className="w-5 h-5 text-[#FF7A00]" />
              </div>

              <div className="space-y-xl">
                {['Reserve', 'Yield', 'Growth', 'Degen'].map((vault) => {
                  const val = strategy.data?.allocation[vault.toLowerCase() as keyof typeof strategy.data.allocation] || 0;
                  return (
                    <div key={vault} className="space-y-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{vault}</span>
                        <span className="text-sm font-mono text-[#FF7A00]">{val.toFixed(1)}% Target</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          className="h-full bg-gradient-to-r from-[#FF7A00] to-white shadow-[0_0_10px_rgba(255,122,0,0.3)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ShadowCard>

            {/* System Integrity */}
            <ShadowCard className="lg:col-span-4 p-xl flex flex-col justify-center text-center">
              <div className="p-4 rounded-full bg-white/5 mx-auto mb-lg">
                <Cpu className="w-12 h-12 text-shadow-gold animate-pulse" />
              </div>
              <ShadowTypography variant="h3" className="text-white">100% ZK-Verifiable</ShadowTypography>
              <p className="text-xs text-shadow-500 mt-md leading-relaxed px-lg">
                Every rebalance action is calculated on-chain via ZK-Rollups. No private keys are ever stored on our servers.
              </p>
            </ShadowCard>
          </div>
        </div>
      </main>
    </div>
  );
};

const SignalCard = ({ label, value, icon, subValue }: any) => (
  <ShadowCard className="p-xl border-white/5 bg-shadow-black/50 hover:bg-shadow-black transition-all">
    <div className="flex items-center justify-between mb-lg">
      <p className="text-[10px] font-bold text-shadow-600 uppercase tracking-widest">{label}</p>
      {icon}
    </div>
    <div className="flex items-end gap-2">
      <ShadowTypography variant="h2" className="text-white capitalize leading-none">{value}</ShadowTypography>
      {subValue && <span className="text-[10px] text-shadow-500 font-bold mb-1">{subValue}</span>}
    </div>
  </ShadowCard>
);

export default AIStrategy;
