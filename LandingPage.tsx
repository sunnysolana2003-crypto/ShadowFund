
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Shield, Zap, Lock, Cpu, ArrowRight, ChevronDown } from 'lucide-react';
import { ShadowButton } from './components/ShadowButton';
import { ShadowTypography } from './components/ShadowTypography';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const tokenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tokenContainerRef.current) return;

    const tokens = tokenContainerRef.current.querySelectorAll('.usd1-token');

    tokens.forEach((token) => {
      gsap.to(token, {
        y: `random(-40, 40)`,
        x: `random(-20, 20)`,
        rotation: `random(-15, 15)`,
        duration: `random(3, 6)`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: Math.random() * 2
      });
    });
  }, []);

  const USD1Token = ({ size = "w-16 h-16", className = "" }) => (
    <div className={`usd1-token absolute rounded-full border-2 border-shadow-gold/40 bg-gradient-to-br from-shadow-gold/20 to-shadow-black backdrop-blur-md flex items-center justify-center glow-gold ${size} ${className}`}>
      <span className="text-shadow-gold font-display font-bold text-xs">USD1</span>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-shadow-black overflow-hidden flex flex-col items-center">
      {/* Background Cinematic Elements */}
      <div ref={tokenContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/10 blur-2xl w-96 h-96 bg-[#FF7A00]/5 rounded-full" />
        <div className="absolute bottom-1/4 right-1/10 blur-2xl w-96 h-96 bg-shadow-gold/5 rounded-full" />

        {/* Animated Tokens for Parallax Effect */}
        <USD1Token className="top-[15%] left-[10%]" size="w-20 h-20" />
        <USD1Token className="top-[60%] left-[15%]" size="w-12 h-12" />
        <USD1Token className="top-[25%] right-[20%]" size="w-24 h-24" />
        <USD1Token className="top-[70%] right-[10%]" size="w-16 h-16" />
        <USD1Token className="bottom-[10%] left-[40%]" size="w-14 h-14" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 w-full max-w-7xl px-lg py-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-[#FF7A00] flex items-center justify-center rounded-sm shadow-[0_0_10px_rgba(255,122,0,0.3)]">
            <Shield className="w-5 h-5 text-[#FF7A00]" />
          </div>
          <span className="text-white font-display font-black tracking-tighter uppercase text-lg">
            Shadow<span className="text-[#FF7A00]">Agent</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-xl">
          <a href="#" className="text-xs uppercase tracking-widest font-bold text-shadow-500 hover:text-white transition-colors">Technology</a>
          <a href="#" className="text-xs uppercase tracking-widest font-bold text-shadow-500 hover:text-white transition-colors">Treasury</a>
          <a href="#" className="text-xs uppercase tracking-widest font-bold text-shadow-500 hover:text-white transition-colors">Governance</a>
          <ShadowButton variant="secondary" size="sm" onClick={onEnter}>Launch App</ShadowButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-lg max-w-4xl py-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/5 backdrop-blur-md">
            <Zap className="w-3 h-3 text-[#FF7A00]" />
            <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-[0.2em]">Institutional Privacy Protocol</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-none">
            Invisible <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] via-shadow-gold to-[#FF7A00] bg-[length:200%_auto] animate-[gradient_8s_linear_infinite]">DeFi Yields</span>
          </h1>

          <p className="text-lg md:text-xl text-shadow-400 max-w-2xl mx-auto font-light leading-relaxed">
            A privacy-first agent that optimizes your USD1 holdings using zero-knowledge proofs. Earn maximally without revealing your strategies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-md pt-lg">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <ShadowButton
                variant="primary"
                size="lg"
                className="px-12 group"
                onClick={onEnter}
              >
                Connect Wallet
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </ShadowButton>
            </motion.div>
            <ShadowButton variant="secondary" size="lg" className="text-shadow-400" onClick={onEnter}>
              Read Docs
            </ShadowButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <ChevronDown className="w-6 h-6 text-shadow-700" />
        </motion.div>
      </section>

      {/* Features Preview */}
      <section className="relative z-10 w-full max-w-7xl px-lg py-3xl grid grid-cols-1 md:grid-cols-3 gap-xl">
        {[
          {
            icon: <Cpu className="w-8 h-8" />,
            title: "Total Privacy",
            description: "Deep-learning models constantly rebalance your USD1 for maximum risk-adjusted yield across every chain.",
            color: "text-shadow-gold"
          },
          {
            icon: <Lock className="w-8 h-8" />,
            title: "Instant Execution",
            description: "Every transaction is shielded. Your balance and strategy are known only to you and the treasury node.",
            color: "text-[#FF7A00]"
          },
          {
            icon: <Shield className="w-8 h-8" />,
            title: "Yield Optimization",
            description: "Multi-sig protection meets autonomous execution. Secured by a decentralized network of private validators.",
            color: "text-[#FF7A00]"
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="p-xl rounded-2xl glass-panel-light border-white/5 space-y-md group hover:border-[#FF7A00]/20 transition-all duration-500"
          >
            <div className={`${feature.color} group-hover:scale-110 transition-transform duration-500`}>
              {feature.icon}
            </div>
            <ShadowTypography variant="h3" className="text-white">{feature.title}</ShadowTypography>
            <p className="text-shadow-500 text-sm leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      <footer className="relative z-10 w-full max-w-7xl px-lg py-xl flex flex-col md:flex-row items-center justify-between border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-shadow-700">
        <div className="mb-4 md:mb-0">© 2024 ShadowAgent protocol. All rights reserved.</div>
        <div className="flex gap-xl">
          <a href="#" className="hover:text-[#FF7A00] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#FF7A00] transition-colors">Term of Use</a>
          <a href="#" className="hover:text-[#FF7A00] transition-colors">Documentation</a>
        </div>
      </footer>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
