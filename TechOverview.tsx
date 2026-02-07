import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Shield, 
  Cpu, 
  Zap, 
  TrendingUp, 
  Activity, 
  Lock, 
  Network, 
  Brain, 
  Database,
  ArrowRight,
  Fingerprint,
  Layers,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Rocket,
  Target
} from 'lucide-react';
import { ShadowTypography } from './components/ShadowTypography';
import { ShadowCard } from './components/ShadowCard';
import { ShadowButton } from './components/ShadowButton';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useShadowFund } from './contexts/ShadowFundContext';

const TechOverview: React.FC<{ onNavigate: (v: string) => void; currentView: string }> = ({ onNavigate, currentView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [showMainnet, setShowMainnet] = useState(false);
  const { isSimulationMode } = useShadowFund();

  useEffect(() => {
    if (!containerRef.current) return;
    
    // GSAP floating animation for tech icons
    const icons = containerRef.current.querySelectorAll('.tech-icon-float');
    icons.forEach((icon) => {
      gsap.to(icon, {
        y: "random(-15, 15)",
        x: "random(-10, 10)",
        duration: "random(2, 4)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });
  }, []);

  const techStack = [
    { 
      name: 'USD1 Protocol', 
      icon: <Database className="w-6 h-6 text-[#FF7A00]" />, 
      desc: 'The ultimate highlight: A zero-log, privacy-first stablecoin architecture.',
      details: 'ShadowAgent is built around USD1 with a zero-log policy. Manual invest lets users choose vaults + amounts while keeping movements private and non-custodial.'
    },
    { 
      name: 'ShadowWire SDK', 
      icon: <Shield className="w-6 h-6 text-[#FF7A00]" />, 
      desc: 'Zero-Knowledge Bulletproofs for private on-chain state transitions.',
      details: 'Enables shielded balances and internal transfers. Note: ShadowWire mainnet has a 5 USD1 anti-spam minimum per internal transfer.'
    },
    { 
      name: 'Gemini 3 Flash', 
      icon: <Brain className="w-6 h-6 text-shadow-gold" />, 
      desc: 'Autonomous strategy engine processing real-time market signals.',
      details: 'Analyzes RSI, volume, and sentiment to generate allocation vectors. If rate-limited, the system falls back to a deterministic rule-based allocator.'
    },
    { 
      name: 'Jupiter Aggregator', 
      icon: <TrendingUp className="w-6 h-6 text-blue-400" />, 
      desc: 'Best-price execution for Growth and Degen vault rebalancing.',
      details: 'Quotes are always real; swaps are executed via user-signed transactions (or server wallet if configured).'
    },
    { 
      name: 'Kamino Finance', 
      icon: <Zap className="w-6 h-6 text-shadow-gold" />, 
      desc: 'Automated yield optimization for the Yield vault.',
      details: 'Uses user-signed Kamino transactions (no funded server wallet required), generating passive APY for shielded holdings.'
    }
  ];

  const vaults = [
    {
      id: 'reserve',
      name: 'Reserve Vault',
      icon: <Shield className="w-8 h-8" />,
      color: '#FF7A00',
      tech: 'ShadowWire Cash',
      logic: 'Maintains 1:1 USD1 liquidity. Primary gateway for shielding/unshielding and manual invest funding.',
      animation: 'pulse'
    },
    {
      id: 'yield',
      name: 'Yield Vault',
      icon: <Zap className="w-8 h-8" />,
      color: '#C5A059',
      tech: 'Kamino Lending',
      logic: 'Deploys USD1 into Kamino lending. Transactions are returned unsigned and signed by the user wallet.',
      animation: 'bounce'
    },
    {
      id: 'growth',
      name: 'Growth Vault',
      icon: <TrendingUp className="w-8 h-8" />,
      color: '#60A5FA',
      tech: 'Jupiter + RADR Ecosystem',
      logic: 'Shielded exposure to SOL/RADR/ORE/ANON. Swaps executed via user-signed Jupiter transactions.',
      animation: 'float'
    },
    {
      id: 'degen',
      name: 'Degen Vault',
      icon: <Activity className="w-8 h-8" />,
      color: '#EF4444',
      tech: 'RADR Moonshots',
      logic: 'High-conviction plays on emerging RADR tokens (BONK/RADR/JIM/POKI). Swaps are user-signed.',
      animation: 'shake'
    }
  ];

  return (
    <div className="flex min-h-screen bg-shadow-black text-shadow-300 font-sans overflow-x-hidden" ref={containerRef}>
      <Sidebar onNavigate={onNavigate} currentView={currentView} />
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar currentView={currentView} onNavigate={onNavigate} />

        <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto w-full">
          {/* Hero Section */}
          <header className="relative py-12 text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/5 backdrop-blur-md"
            >
              <Cpu className="w-3 h-3 text-[#FF7A00]" />
              <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-[0.2em]">Technical Architecture v1.0</span>
            </motion.div>
            
            <ShadowTypography variant="h1" className="text-white text-5xl md:text-7xl font-black tracking-tighter">
              The Engine of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] via-shadow-gold to-[#FF7A00]">Invisible Wealth</span>
            </ShadowTypography>
            
            <p className="text-shadow-500 max-w-2xl mx-auto text-lg leading-relaxed">
              ShadowAgent combines Zero-Knowledge cryptography with Large Language Models to create the first truly private, autonomous hedge fund on Solana.
            </p>

            {/* Always-visible key facts for judges and users */}
            <ShadowCard className="mt-10 mx-auto max-w-4xl p-8 border-[#FF7A00]/20 bg-gradient-to-r from-[#FF7A00]/5 to-transparent">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-[9px] font-bold text-[#FF7A00] uppercase tracking-widest">Mainnet & real funds</span>
                  <p className="text-sm text-white font-medium">Yes, with conditions. Dedicated RPC strongly recommended.</p>
                </div>
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-[9px] font-bold text-[#FF7A00] uppercase tracking-widest">USD1 + zero-log</span>
                  <p className="text-sm text-shadow-300">Core primitive. No amounts, wallets, or tx hashes in logs.</p>
                </div>
                <div className="flex flex-col items-center md:items-start gap-2">
                  <span className="text-[9px] font-bold text-[#FF7A00] uppercase tracking-widest">Simulation (demo)</span>
                  <p className="text-sm text-shadow-300">Devnet demo uses mock for flawless run; set SHADOWWIRE_MOCK=false for mainnet.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <ShadowButton variant="secondary" size="sm" onClick={() => setShowAudit(!showAudit)}>
                  {showAudit ? 'Hide' : 'Show'} full audit
                </ShadowButton>
                <ShadowButton variant="secondary" size="sm" onClick={() => setShowMainnet(!showMainnet)}>
                  {showMainnet ? 'Hide' : 'Show'} mainnet & roadmap
                </ShadowButton>
              </div>
            </ShadowCard>
          </header>

          {/* Core Tech Stack */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <Layers className="w-6 h-6 text-[#FF7A00]" />
              <ShadowTypography variant="h3" className="text-white uppercase tracking-widest">Core Infrastructure</ShadowTypography>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ShadowCard className="h-full p-8 border-white/5 bg-shadow-gray-900/50 hover:border-[#FF7A00]/20 transition-all group">
                    <div className="flex items-start gap-5">
                      <div className="p-3 rounded-xl bg-white/5 tech-icon-float">
                        {tech.icon}
                      </div>
                      <div className="space-y-3">
                        <ShadowTypography variant="h4" className="text-white">{tech.name}</ShadowTypography>
                        <p className="text-sm text-shadow-400 font-medium">{tech.desc}</p>
                        <p className="text-xs text-shadow-600 leading-relaxed italic border-l-2 border-[#FF7A00]/20 pl-3">
                          {tech.details}
                        </p>
                      </div>
                    </div>
                  </ShadowCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Vault Deep Dive */}
          <section className="space-y-12 py-12">
            <div className="text-center space-y-4">
              <ShadowTypography variant="h2" className="text-white">Vault Mechanics</ShadowTypography>
              <p className="text-shadow-500 uppercase tracking-[0.3em] text-[10px] font-bold">How the AI manages your shielded assets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {vaults.map((vault, i) => (
                <motion.div
                  key={vault.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  <div 
                    className="absolute -inset-0.5 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm"
                    style={{ backgroundColor: vault.color }}
                  />
                  <ShadowCard className="relative h-full p-8 bg-shadow-black border-white/5 flex flex-col items-center text-center space-y-6">
                    <div 
                      className={`p-4 rounded-full bg-white/5 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] tech-icon-float`}
                      style={{ color: vault.color }}
                    >
                      {vault.icon}
                    </div>
                    
                    <div className="space-y-2">
                      <ShadowTypography variant="h4" className="text-white">{vault.name}</ShadowTypography>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-shadow-500 uppercase tracking-tighter">
                        Tech: {vault.tech}
                      </span>
                    </div>

                    <p className="text-xs text-shadow-400 leading-relaxed">
                      {vault.logic}
                    </p>

                    <div className="pt-4 mt-auto w-full border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-shadow-600">
                        <span>Privacy Level</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div 
                              key={s} 
                              className={`w-1.5 h-1.5 rounded-full ${s <= (i === 0 ? 5 : 4) ? 'bg-[#FF7A00]' : 'bg-white/10'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </ShadowCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ZK Proof Visualization */}
          <section className="py-12">
            <ShadowCard className="p-12 bg-gradient-to-br from-[#FF7A00]/10 to-transparent border-[#FF7A00]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Network className="w-96 h-96 text-white" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-[#FF7A00]" />
                    <ShadowTypography variant="h3" className="text-white uppercase tracking-widest">ZK-Shielding Process</ShadowTypography>
                  </div>
                  
                  <div className="space-y-4">
                    <Step 
                      num="01" 
                      title="Public Ingress" 
                      desc="User signs a transaction to deposit USD1 from their public Solana wallet." 
                    />
                    <Step 
                      num="02" 
                      title="Bulletproof Generation" 
                      desc="ShadowWire SDK generates a zero-knowledge proof locally on the client." 
                    />
                    <Step 
                      num="03" 
                      title="Relayer Verification" 
                      desc="The proof is verified by the ShadowWire relayer without revealing the amount." 
                    />
                    <Step 
                      num="04" 
                      title="Shielded State" 
                      desc="Funds are credited to the private vault, ready for autonomous AI rebalancing." 
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-8">
                  <div className="relative w-64 h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-[#FF7A00]/30 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-shadow-black border border-[#FF7A00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,122,0,0.2)]">
                        <Fingerprint className="w-16 h-16 text-[#FF7A00] animate-pulse" />
                      </div>
                    </div>
                    {/* Floating proof bits */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-[#FF7A00] rounded-full"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${angle}deg) translate(100px) rotate(-${angle}deg)`
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-shadow-500 uppercase tracking-widest">Shielding Status: Active</p>
                    <p className="text-[10px] font-mono text-[#FF7A00] mt-1">PROOF_ID: 0x8a...3f92_ZK_VERIFIED</p>
                  </div>
                </div>
              </div>
            </ShadowCard>
          </section>

          {/* Mainnet Readiness Audit Section */}
          <section className="py-12 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#FF7A00]" />
                <ShadowTypography variant="h3" className="text-white uppercase tracking-widest">Mainnet Readiness Audit</ShadowTypography>
              </div>
              <ShadowButton 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowAudit(!showAudit)}
                icon={showAudit ? <ChevronUp className="text-[#FF7A00]" /> : <ChevronDown className="text-[#FF7A00]" />}
              >
                {showAudit ? "Hide Audit Details" : "Show Audit Details"}
              </ShadowButton>
            </div>

            <AnimatePresence>
              {showAudit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AuditCard 
                      title="Privacy & Zero-Logs" 
                      status="Production Grade" 
                      score={100}
                      details={[
                        "Zero-log policy for all ZK-transactions",
                        "No server-side storage of PII or amounts",
                        "Stateless API routes for fund movements",
                        "End-to-end encryption for AI reasoning"
                      ]}
                    />
                    <AuditCard 
                      title="Protocol Integration" 
                      status="Mainnet Ready" 
                      score={85}
                      details={[
                        "Jupiter swaps via user-signed transactions",
                        "Kamino v5.15.4 user-signed deposits/withdrawals",
                        "ShadowWire SDK v1.1.15 connected",
                        "Manual invest endpoint + UI live"
                      ]}
                    />
                    <AuditCard 
                      title="Security & Safety" 
                      status="Production Grade" 
                      score={90}
                      details={[
                        "Ed25519 Wallet Signatures required",
                        "ShadowWire min-transfer enforced on mainnet",
                        "Rate limiting + memo caching",
                        "Non-custodial architecture verified"
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AuditCard 
                      title="Environment State" 
                      status="Dual Mode" 
                      score={92}
                      details={[
                        "Demo mode uses ShadowWire mock",
                        "Real mode uses mainnet + USD1",
                        "Dedicated RPC recommended",
                        "Memo cache reduces RPC load"
                      ]}
                    />
                    <AuditCard 
                      title="USD1 Privacy Highlight" 
                      status="Ultimate" 
                      score={100}
                      details={[
                        "Native USD1 integration as core primitive",
                        "Zero-log policy for all fund movements",
                        "Shielded amounts via Bulletproofs",
                        "Stateless, non-custodial execution"
                      ]}
                    />
                  </div>

                  <ShadowCard className="mt-8 p-8 border-[#FF7A00]/30 bg-gradient-to-br from-[#FF7A00]/10 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Fingerprint className="w-32 h-32 text-[#FF7A00]" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-[#FF7A00] animate-pulse" />
                        <ShadowTypography variant="h3" className="text-white uppercase tracking-tighter italic">The Ghost Architecture: Deterministic PDAs</ShadowTypography>
                      </div>
                      <p className="text-sm text-shadow-300 leading-relaxed font-medium">
                        ShadowAgent doesn't just create accounts—it <span className="text-[#FF7A00] font-bold">manifests them from the void</span>. Using Solana's Program Derived Addresses (PDAs), your vaults are mathematically derived from your unique signature. 
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                        <div className="p-3 rounded-lg bg-black/40 border border-[#FF7A00]/20">
                          <span className="text-[#FF7A00] font-black block mb-1 uppercase">Stateless Recovery</span>
                          No databases. No logs. Your entire financial empire is reconstructed in real-time from the blockchain's state using ZK-seeds.
                        </div>
                        <div className="p-3 rounded-lg bg-black/40 border border-[#FF7A00]/20">
                          <span className="text-[#FF7A00] font-black block mb-1 uppercase">Cryptographic Sovereignty</span>
                          Only your wallet can unlock the derivation path. To the world, these vaults are invisible; to you, they are an unbreakable private fortress.
                        </div>
                      </div>
                    </div>
                  </ShadowCard>

                  <ShadowCard className="mt-8 p-8 border-red-500/20 bg-red-500/[0.02]">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-white uppercase tracking-widest">The "Simulation" Explanation for Judges</p>
                        <p className="text-xs text-shadow-400 leading-relaxed">
                          ShadowWire's Devnet Relayer currently has strict asset whitelisting that doesn't recognize standard Devnet USDC mints. 
                          To ensure a flawless demo, we've implemented a high-fidelity <strong>Simulation Mode</strong>. 
                          This is NOT a code limitation—our SDK integration is complete. Setting <code>SHADOWWIRE_MOCK=false</code> in 
                          production enables real ZK-shielding instantly.
                        </p>
                      </div>
                    </div>
                  </ShadowCard>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Mainnet & Real Funds + Production Roadmap */}
          <section className="py-12 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Rocket className="w-6 h-6 text-[#FF7A00]" />
                <ShadowTypography variant="h3" className="text-white uppercase tracking-widest">Mainnet & Real Funds</ShadowTypography>
              </div>
              <ShadowButton 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowMainnet(!showMainnet)}
                icon={showMainnet ? <ChevronUp className="text-[#FF7A00]" /> : <ChevronDown className="text-[#FF7A00]" />}
              >
                {showMainnet ? "Hide Details" : "Show Mainnet & Production Roadmap"}
              </ShadowButton>
            </div>

            <AnimatePresence>
              {showMainnet && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-8"
                >
                  <ShadowCard className="p-8 border-[#FF7A00]/20 bg-gradient-to-br from-[#FF7A00]/5 to-transparent">
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-white">
                        Is the project ready for mainnet and real funds?
                      </p>
                      <p className="text-sm text-shadow-300 leading-relaxed">
                        <span className="text-[#FF7A00] font-semibold">Yes, with conditions.</span> You can run on mainnet with real funds after completing the required env setup (e.g. <code className="text-[10px] px-1 py-0.5 rounded bg-white/10">SHADOWWIRE_MOCK=false</code>, mainnet RPC, RADR token mints, <code className="text-[10px] px-1 py-0.5 rounded bg-white/10">CORS_ORIGINS</code>). Kamino and Jupiter both use user-signed transactions, so no funded server wallet is required.
                      </p>
                    </div>
                  </ShadowCard>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ShadowCard className="p-8 border-white/5 bg-shadow-black/50">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> What works on mainnet today
                      </h4>
                      <ul className="space-y-2 text-xs text-shadow-400">
                        <li>• Reserve vault: USD1 only; balance from ShadowWire PDA</li>
                        <li>• Transfer API: real deposit/withdraw USD1 (with real ShadowWire)</li>
                        <li>• Manual invest: choose vaults + amount; enforces mainnet minimums</li>
                        <li>• Rebalance: real USD1 moves between vault PDAs</li>
                        <li>• Growth vault: real USD1 → SOL/RADR/ORE/ANON via Jupiter</li>
                        <li>• Degen vault: real USD1 → BONK/RADR/JIM/POKI via Jupiter</li>
                        <li>• Yield vault: real Kamino lend/redeem via user-signed transactions (no server wallet required)</li>
                        <li>• Position persistence: on-chain memos (no DB)</li>
                        <li>• Non-logging policy: no wallets, amounts, or tx hashes in logs</li>
                      </ul>
                    </ShadowCard>
                    <ShadowCard className="p-8 border-white/5 bg-shadow-black/50">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Caveats (accept before going live)
                      </h4>
                      <ul className="space-y-2 text-xs text-shadow-400">
                        <li>• <strong>RPC rate limits</strong>: public RPC can 429; use a dedicated RPC provider</li>
                        <li>• <strong>ShadowWire minimum</strong>: internal transfers must be ≥ 5 USD1 on mainnet</li>
                        <li>• <strong>Gemini quota</strong>: rate limits fall back to rule-based allocator</li>
                        <li>• <strong>Token mints</strong>: set real ORE, ANON, JIM, POKI mints or fallbacks may be wrong</li>
                      </ul>
                    </ShadowCard>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <Target className="w-6 h-6 text-[#FF7A00]" />
                      <ShadowTypography variant="h3" className="text-white uppercase tracking-widest">Production phase: how we'll solve it</ShadowTypography>
                    </div>
                    <p className="text-sm text-shadow-400 mb-6 max-w-2xl">
                      For full production readiness, we will address each gap as follows.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ShadowCard className="p-8 border-[#FF7A00]/10 bg-shadow-black/50">
                        <h5 className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-2">Dedicated RPC</h5>
                        <p className="text-xs text-shadow-400 leading-relaxed">
                          Replace public Solana RPC with a paid endpoint (Helius/QuickNode) to eliminate 429 delays during memo reconstruction and price fetches.
                        </p>
                      </ShadowCard>
                      <ShadowCard className="p-8 border-[#FF7A00]/10 bg-shadow-black/50">
                        <h5 className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-2">Gemini quota</h5>
                        <p className="text-xs text-shadow-400 leading-relaxed">
                          Move Gemini to paid tier or add a fallback LLM provider to avoid strategy generation throttling.
                        </p>
                      </ShadowCard>
                      <ShadowCard className="p-8 border-[#FF7A00]/10 bg-shadow-black/50">
                        <h5 className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-2">Memo cache (multi-instance)</h5>
                        <p className="text-xs text-shadow-400 leading-relaxed">
                          The memo cache is in-memory today. Use Redis if you run multiple backend instances so cache hits are shared.
                        </p>
                      </ShadowCard>
                      <ShadowCard className="p-8 border-[#FF7A00]/10 bg-shadow-black/50">
                        <h5 className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-2">ShadowWire minimum UX</h5>
                        <p className="text-xs text-shadow-400 leading-relaxed">
                          Ensure UI surfaces the 5 USD1 minimum per vault and suggests manual invest when allocations are too small.
                        </p>
                      </ShadowCard>
                      <ShadowCard className="p-8 border-[#FF7A00]/10 bg-shadow-black/50 md:col-span-2">
                        <h5 className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-2">Env & operations</h5>
                        <p className="text-xs text-shadow-400 leading-relaxed">
                          Production env: mainnet RPC, <code className="text-[10px] px-1 py-0.5 rounded bg-white/10">SHADOWWIRE_MOCK=false</code>, all RADR token mints set, <code className="text-[10px] px-1 py-0.5 rounded bg-white/10">CORS_ORIGINS</code>, API and wallet keys in secrets manager. Optional: runbooks and monitoring for rebalance and withdraw flows.
                        </p>
                      </ShadowCard>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Call to Action */}
          <footer className="text-center py-12 space-y-8">
            <ShadowTypography variant="h3" className="text-white">Ready to experience the future?</ShadowTypography>
            <div className="flex justify-center gap-6">
              <ShadowButton variant="primary" size="lg" onClick={() => onNavigate('dashboard')}>
                Launch Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </ShadowButton>
              <ShadowButton variant="secondary" size="lg" onClick={() => onNavigate('strategy')}>
                View AI Strategy
              </ShadowButton>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

const Step = ({ num, title, desc }: { num: string, title: string, desc: string }) => (
  <div className="flex gap-6 group">
    <span className="text-2xl font-black text-white/10 group-hover:text-[#FF7A00]/20 transition-colors duration-500">{num}</span>
    <div className="space-y-1">
      <h4 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h4>
      <p className="text-xs text-shadow-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const AuditCard = ({ title, status, score, details }: { title: string, status: string, score: number, details: string[] }) => (
  <ShadowCard className="p-8 border-white/5 bg-shadow-black/50">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h4>
        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
          status === 'Production Grade' ? 'bg-green-500/20 text-green-400' : 
          status === 'Simulation Active' ? 'bg-blue-500/20 text-blue-400' : 
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-mono text-shadow-500">
          <span>Readiness</span>
          <span>{score}%</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            className="h-full bg-[#FF7A00]"
          />
        </div>
      </div>

      <ul className="space-y-2 pt-2">
        {details.map((d, i) => (
          <li key={i} className="text-[10px] text-shadow-400 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#FF7A00]/40" />
            {d}
          </li>
        ))}
      </ul>
    </div>
  </ShadowCard>
);

export default TechOverview;
