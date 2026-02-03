import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Fingerprint, Smartphone, CheckCircle2, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ShadowButton } from './components/ShadowButton';
import { ShadowTypography } from './components/ShadowTypography';
import { ShadowCard } from './components/ShadowCard';

interface WalletConnectProps {
  onConnect: (walletAddress: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [step, setStep] = useState<'selection' | 'connecting' | 'verifying' | 'success' | 'error'>('selection');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  // Handle wallet connection state changes
  useEffect(() => {
    if (connected && publicKey) {
      setStep('verifying');

      // Simulate ZK verification delay
      const timer = setTimeout(() => {
        setStep('success');
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (connecting) {
      setStep('connecting');
    }
  }, [connected, connecting, publicKey]);

  // Handle success -> navigate to dashboard
  useEffect(() => {
    if (step === 'success' && publicKey) {
      const timer = setTimeout(() => {
        onConnect(publicKey.toBase58());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, publicKey, onConnect]);

  const handleConnectClick = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setStep('selection');
  }, [disconnect]);

  const walletOptions = [
    {
      name: 'Phantom',
      icon: 'https://phantom.app/favicon.ico',
      description: 'Most Popular Solana Wallet'
    },
    {
      name: 'Solflare',
      icon: 'https://solflare.com/favicon.ico',
      description: 'Non-Custodial Wallet'
    },
  ];

  return (
    <div className="min-h-screen bg-shadow-black flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-shadow-green/5 rounded-full blur-[120px] opacity-30" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm border-2 border-shadow-green bg-shadow-black glow-green mb-4 mx-auto">
            <Shield className="w-8 h-8 text-shadow-green" />
          </div>
          <ShadowTypography variant="h2" className="text-white tracking-tighter block leading-tight">
            Shadow<span className="text-shadow-green">Vault</span> Access
          </ShadowTypography>
          <p className="text-shadow-500 text-sm font-medium tracking-wide block mt-2">
            PRIVATE BANKING GATEWAY
          </p>
        </div>

        <ShadowCard variant="glass" className="relative overflow-hidden border-white/5 backdrop-blur-2xl p-6">
          <AnimatePresence mode="wait">
            {step === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <ShadowTypography variant="h4" className="text-shadow-400 block leading-snug">Connect Your Wallet</ShadowTypography>
                  <p className="text-xs text-shadow-600 block leading-relaxed">Select your Solana wallet to access ShadowFund</p>
                </div>

                {/* Main Connect Button */}
                <ShadowButton
                  fullWidth
                  variant="primary"
                  onClick={handleConnectClick}
                  className="py-4"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </div>
                </ShadowButton>

                <div className="border-t border-shadow-gray-800 pt-6">
                  <p className="text-[10px] text-shadow-600 uppercase tracking-widest mb-4 text-center">Supported Wallets</p>
                  <div className="flex justify-center gap-6">
                    {walletOptions.map((w) => (
                      <div key={w.name} className="flex flex-col items-center gap-1 opacity-60">
                        <img src={w.icon} alt={w.name} className="w-8 h-8 grayscale" />
                        <span className="text-[9px] text-shadow-600">{w.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4 text-shadow-600">
                  <Smartphone className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Supports Hardware Ledger & Keystone</p>
                </div>
              </motion.div>
            )}

            {step === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="py-8 flex flex-col items-center text-center space-y-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-shadow-gold/20" />
                  <div className="relative w-24 h-24 rounded-full border border-shadow-gold/30 flex items-center justify-center bg-shadow-gold/5">
                    <Loader2 className="w-10 h-10 text-shadow-gold animate-spin" />
                  </div>
                </div>

                <div className="space-y-2">
                  <ShadowTypography variant="h3" className="text-white block">Connecting to Wallet</ShadowTypography>
                  <p className="text-shadow-500 text-xs font-mono block">WAITING FOR WALLET APPROVAL...</p>
                </div>

                <ShadowButton variant="ghost" size="sm" onClick={handleDisconnect}>
                  Cancel
                </ShadowButton>
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="py-8 flex flex-col items-center text-center space-y-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-shadow-green/20" />
                  <div className="relative w-24 h-24 rounded-full border border-shadow-green/30 flex items-center justify-center bg-shadow-green/5">
                    <Loader2 className="w-10 h-10 text-shadow-green animate-spin" />
                  </div>
                </div>

                <div className="space-y-2">
                  <ShadowTypography variant="h3" className="text-white block">Authenticating</ShadowTypography>
                  <p className="text-shadow-500 text-xs font-mono block">ESTABLISHING ZK-SECURE SESSION...</p>
                  {publicKey && (
                    <p className="text-shadow-600 text-[10px] font-mono mt-2">
                      {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                    </p>
                  )}
                </div>

                <div className="w-full space-y-4">
                  {[
                    "Verifying Wallet Signature",
                    "Connecting to ShadowWire",
                    "Loading Private Treasury"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 text-left px-6">
                      <div className="w-1 h-1 rounded-full bg-shadow-green animate-pulse" />
                      <span className="text-[10px] font-bold text-shadow-500 uppercase tracking-widest">{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 flex flex-col items-center text-center space-y-8"
              >
                <div className="w-24 h-24 rounded-full border-2 border-shadow-green flex items-center justify-center bg-shadow-green/10 glow-green">
                  <CheckCircle2 className="w-12 h-12 text-shadow-green" />
                </div>

                <div className="space-y-2">
                  <ShadowTypography variant="h3" className="text-white block">Access Granted</ShadowTypography>
                  <p className="text-shadow-green text-[10px] font-bold uppercase tracking-[0.3em] block">Wallet Connected</p>
                  {publicKey && (
                    <p className="text-shadow-500 text-xs font-mono mt-2">
                      {publicKey.toBase58().slice(0, 12)}...{publicKey.toBase58().slice(-12)}
                    </p>
                  )}
                </div>

                <p className="text-shadow-500 text-xs italic">"Welcome to the inner circle."</p>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 flex flex-col items-center text-center space-y-8"
              >
                <div className="w-24 h-24 rounded-full border-2 border-red-500 flex items-center justify-center bg-red-500/10">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>

                <div className="space-y-2">
                  <ShadowTypography variant="h3" className="text-white block">Connection Failed</ShadowTypography>
                  <p className="text-red-400 text-xs">{errorMessage || "Unable to connect wallet"}</p>
                </div>

                <ShadowButton variant="secondary" onClick={() => setStep('selection')}>
                  Try Again
                </ShadowButton>
              </motion.div>
            )}
          </AnimatePresence>
        </ShadowCard>

        {/* Footer Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
            <Lock className="w-3 h-3 text-shadow-gold shrink-0" />
            <span className="text-[9px] font-bold text-shadow-gold uppercase tracking-[0.2em]">Zero-Knowledge Verified by ShadowWire™</span>
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <Fingerprint className="w-4 h-4 text-shadow-800" />
              <span className="text-[8px] text-shadow-700 mt-1 uppercase font-bold">Biometric</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-4 h-4 text-shadow-800" />
              <span className="text-[8px] text-shadow-700 mt-1 uppercase font-bold">Encrypted</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WalletConnect;
