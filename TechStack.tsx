import React from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, 
  Server, 
  Globe, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Database,
  Terminal,
  Layers,
  Box,
  Braces,
  Cloud,
  LayoutGrid,
  Settings,
  Shield
} from 'lucide-react';
import { ShadowTypography } from './components/ShadowTypography';
import { ShadowCard } from './components/ShadowCard';
import { ShadowButton } from './components/ShadowButton';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useShadowFund } from './contexts/ShadowFundContext';

const TechStack: React.FC<{ onNavigate: (v: string) => void; currentView: string }> = ({ onNavigate, currentView }) => {
  const { isSimulationMode } = useShadowFund();
  const categories = [
    {
      title: "Frontend Architecture",
      icon: <Globe className="w-6 h-6 text-[#FF7A00]" />,
      items: [
        { name: "React 18", desc: "Modern UI framework powering the dashboard and animated experience." },
        { name: "Vite 6", desc: "Next-generation frontend tooling for lightning-fast HMR." },
        { name: "Tailwind CSS", desc: "Utility-first CSS for rapid, responsive design system development." },
        { name: "Framer Motion", desc: "Production-ready motion library for smooth UI transitions." },
        { name: "GSAP", desc: "Professional-grade animation engine for complex visual effects." }
      ]
    },
    {
      title: "Backend & API",
      icon: <Server className="w-6 h-6 text-[#FF7A00]" />,
      items: [
        { name: "Next.js 14", desc: "Serverless API routes and optimized backend logic." },
        { name: "TypeScript", desc: "Strict typing across the full stack for maximum reliability." },
        { name: "Node.js", desc: "High-performance runtime for strategy orchestration." },
        { name: "REST API", desc: "Stateless communication between frontend and treasury engine." }
      ]
    },
    {
      title: "Blockchain & Privacy",
      icon: <ShieldCheck className="w-6 h-6 text-[#FF7A00]" />,
      items: [
        { name: "ShadowWire SDK", desc: "The core ZK-privacy layer for shielded transactions." },
        { name: "@solana/web3.js", desc: "Official Solana library for on-chain interactions." },
        { name: "Jupiter SDK", desc: "DEX aggregation for best-price swap execution." },
        { name: "Kamino SDK", desc: "Lending protocol integration for automated yield." }
      ]
    },
    {
      title: "AI & Intelligence",
      icon: <Cpu className="w-6 h-6 text-[#FF7A00]" />,
      items: [
        { name: "Gemini 3 Flash", desc: "Google's high-speed LLM for real-time market analysis." },
        { name: "Market Signals", desc: "Custom data ingestion from CoinGecko and DexScreener." },
        { name: "Strategy Engine", desc: "Rule-based and AI-driven portfolio rebalancing logic." }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-shadow-black text-shadow-300 font-sans">
      <Sidebar onNavigate={onNavigate} currentView={currentView} />
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar />

        <div className="p-xl md:p-2xl space-y-2xl max-w-7xl mx-auto w-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/20">
                <Code2 className="w-3 h-3 text-[#FF7A00]" />
                <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest">Full Stack Blueprint</span>
              </div>
              <ShadowTypography variant="h1" className="text-white">Technology Stack</ShadowTypography>
              <p className="text-shadow-500 max-w-2xl">
                A deep dive into the professional-grade tools and protocols that power the ShadowAgent ecosystem.
              </p>
            </div>
          </header>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ShadowCard className="h-full p-xl border-white/5 bg-shadow-gray-900/30">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-white/5">
                      {cat.icon}
                    </div>
                    <ShadowTypography variant="h3" className="text-white">{cat.title}</ShadowTypography>
                  </div>

                  <div className="space-y-6">
                    {cat.items.map((item) => (
                      <div key={item.name} className="group">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] opacity-40 group-hover:opacity-100 transition-opacity" />
                          <span className="text-sm font-bold text-white tracking-wide">{item.name}</span>
                        </div>
                        <p className="text-xs text-shadow-500 leading-relaxed ml-4.5">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </ShadowCard>
              </motion.div>
            ))}
          </div>

          {/* System Flow Section */}
          <ShadowCard className="p-2xl border-[#FF7A00]/20 bg-gradient-to-br from-[#FF7A00]/5 to-transparent">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-[#FF7A00]" />
                  <ShadowTypography variant="h3" className="text-white uppercase tracking-widest">System Flow</ShadowTypography>
                </div>
                <p className="text-sm text-shadow-400 leading-relaxed">
                  Data flows from public market oracles into our stateless backend, where Gemini AI processes the signals against your risk profile. 
                  The resulting strategy is executed via ShadowWire's ZK-relayer, ensuring your financial footprint is never logged or exposed.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Stateless', 'ZK-Encrypted', 'Non-Custodial', 'AI-Orchestrated'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-shadow-500 uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex-shrink-0 grid grid-cols-2 gap-4">
                <TechBox icon={<Braces className="w-5 h-5" />} label="TypeScript" />
                <TechBox icon={<Box className="w-5 h-5" />} label="Solana" />
                <TechBox icon={<Terminal className="w-5 h-5" />} label="Next.js" />
                <TechBox icon={<Cloud className="w-5 h-5" />} label="Gemini" />
              </div>
            </div>
          </ShadowCard>
        </div>
      </main>
    </div>
  );
};

const TechBox = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="w-28 h-24 rounded-xl bg-shadow-black border border-white/5 flex flex-col items-center justify-center gap-3 hover:border-[#FF7A00]/30 transition-colors group">
    <div className="text-shadow-600 group-hover:text-[#FF7A00] transition-colors">
      {icon}
    </div>
    <span className="text-[10px] font-bold text-shadow-500 uppercase tracking-tighter">{label}</span>
  </div>
);

export default TechStack;
