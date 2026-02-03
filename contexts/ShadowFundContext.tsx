import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, VersionedTransaction, clusterApiUrl } from '@solana/web3.js';
import { api, Treasury, AIStrategy, RebalanceResult, Allocation, VaultStats } from '../services/api';
import bs58 from 'bs58';

interface WalletState {
    connected: boolean;
    address: string | null;
    solBalance: number;
    risk: "low" | "medium" | "high";
}

interface TreasuryState {
    loading: boolean;
    error: string | null;
    data: Treasury | null;
}

interface StrategyState {
    loading: boolean;
    error: string | null;
    data: AIStrategy | null;
}

interface VaultStatsState {
    loading: boolean;
    error: string | null;
    data: VaultStats | null;
}

interface ShadowFundContextType {
    // Wallet state
    wallet: WalletState;
    connectWallet: (address: string) => void;
    disconnectWallet: () => void;
    setRiskLevel: (risk: "low" | "medium" | "high") => void;

    // Demo/simulation mode (build-time flag)
    isSimulationMode: boolean;

    // Treasury state
    treasury: TreasuryState;
    fetchTreasury: (overrideAddress?: string) => Promise<void>;

    // Strategy state
    strategy: StrategyState;
    fetchStrategy: () => Promise<void>;

    // Vault stats (real yield, positions, P&L)
    vaultStats: VaultStatsState;

    // Actions
    rebalance: () => Promise<RebalanceResult | null>;
    isRebalancing: boolean;
    deposit: (amount: number) => Promise<boolean>;
    isDepositing: boolean;
    withdraw: (amount: number) => Promise<boolean>;
    isWithdrawing: boolean;

    // Wallet signing
    signMessage: (message: string) => Promise<{ signature: string; timestamp: number } | null>;
}

const ShadowFundContext = createContext<ShadowFundContextType | null>(null);

// Initialize connection outside component to prevent re-creation on every render
const connection = new Connection(clusterApiUrl('mainnet-beta'), "confirmed");

export function ShadowFundProvider({ children }: { children: ReactNode }) {
    const { publicKey, signMessage: walletSignMessage, connected, sendTransaction } = useWallet();

    // Build-time flag for demo/simulation (set on Vercel as VITE_SHADOWWIRE_MOCK=true)
    const isSimulationMode =
        (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SHADOWWIRE_MOCK === "true") ||
        false;

    // Wallet state
    const [wallet, setWallet] = useState<WalletState>({
        connected: false,
        address: null,
        solBalance: 0,
        risk: "medium"
    });

    // Treasury state
    const [treasury, setTreasury] = useState<TreasuryState>({
        loading: false,
        error: null,
        data: null
    });

    // Strategy state
    const [strategy, setStrategy] = useState<StrategyState>({
        loading: false,
        error: null,
        data: null
    });

    // Vault stats state (real positions, yield, P&L)
    const [vaultStats, setVaultStats] = useState<VaultStatsState>({
        loading: false,
        error: null,
        data: null
    });

    const [isRebalancing, setIsRebalancing] = useState(false);

    // Sync wallet state with Solana wallet adapter
    useEffect(() => {
        let isMounted = true;

        if (connected && publicKey) {
            setWallet(prev => ({
                ...prev,
                connected: true,
                address: publicKey.toBase58()
            }));

            // Fetch SOL Balance with error handling
            const fetchBalance = async () => {
                try {
                    const balance = await connection.getBalance(publicKey);
                    if (isMounted) {
                        setWallet(prev => ({ ...prev, solBalance: balance / 1e9 }));
                    }
                } catch (e) {
                    // Silently handle 403 and rate limit errors - don't spam console
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    if (errorMessage.includes('403') || errorMessage.includes('rate limit')) {
                        console.warn('[Wallet] RPC rate limited or forbidden - using default balance');
                        if (isMounted) {
                            setWallet(prev => ({ ...prev, solBalance: 0 }));
                        }
                    } else {
                        console.error('[Wallet] Failed to fetch SOL balance:', errorMessage);
                    }
                }
            };

            fetchBalance();
        }

        return () => {
            isMounted = false;
        };
    }, [connected, publicKey]); // Removed 'connection' from dependencies to prevent infinite loop

    // Wallet actions
    const connectWallet = useCallback((address: string) => {
        console.log('[Context] Connecting wallet:', address);
        setWallet(prev => ({
            ...prev,
            connected: true,
            address
        }));
    }, []);

    const disconnectWallet = useCallback(() => {
        setWallet({
            connected: false,
            address: null,
            solBalance: 0,
            risk: "medium"
        });
        setTreasury({ loading: false, error: null, data: null });
        setStrategy({ loading: false, error: null, data: null });
    }, []);

    const setRiskLevel = useCallback((risk: "low" | "medium" | "high") => {
        setWallet(prev => ({ ...prev, risk }));
    }, []);

    // Sign message with wallet
    const signMessage = useCallback(async (action: string): Promise<{ signature: string; timestamp: number } | null> => {
        if (!wallet.address || !walletSignMessage) {
            console.error('[Context] Cannot sign: no wallet or signMessage function');
            return null;
        }

        try {
            const timestamp = Date.now();
            const message = `${action}|${wallet.address}|${timestamp}`;
            const encoded = new TextEncoder().encode(message);
            const signatureBytes = await walletSignMessage(encoded);
            const signature = bs58.encode(signatureBytes);

            return { signature, timestamp };
        } catch (error) {
            console.error('[Context] Failed to sign message:', error);
            return null;
        }
    }, [wallet.address, walletSignMessage]);

    // Fetch treasury data from real API (optional overrideAddress for right-after-connect)
    const fetchTreasury = useCallback(async (overrideAddress?: string) => {
        const address = overrideAddress ?? wallet.address;
        if (!address) {
            return;
        }

        setTreasury(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await api.getTreasury(address, wallet.risk);
            setTreasury({ loading: false, error: null, data });
        } catch (err) {
            setTreasury({
                loading: false,
                error: err instanceof Error ? err.message : "Failed to fetch treasury",
                data: null
            });
        }
    }, [wallet.address, wallet.risk]);

    // Fetch strategy data from real API
    const fetchStrategy = useCallback(async () => {
        console.log('[Context] Fetching strategy for risk:', wallet.risk);
        setStrategy(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await api.getStrategy(wallet.risk);
            console.log('[Context] Strategy data:', data);
            setStrategy({ loading: false, error: null, data });
        } catch (err) {
            console.error('[Context] Strategy fetch error:', err);
            setStrategy({
                loading: false,
                error: err instanceof Error ? err.message : "Failed to fetch strategy",
                data: null
            });
        }
    }, [wallet.risk]);

    // Execute rebalance with wallet signature
    const rebalance = useCallback(async (): Promise<RebalanceResult | null> => {
        if (!wallet.address) {
            console.error('[Context] Cannot rebalance: no wallet');
            return null;
        }

        setIsRebalancing(true);
        setVaultStats(prev => ({ ...prev, loading: true }));
        console.log('[Context] Starting rebalance for:', wallet.address);

        try {
            // Sign the rebalance action
            const signatureData = await signMessage("rebalance");

            const result = await api.rebalance(
                wallet.address,
                wallet.risk,
                signatureData ? {
                    ...signatureData,
                    action: "rebalance"
                } : undefined
            );

            console.log('[Context] Rebalance result:', result);

            // Store vault stats from the result
            if (result.vaultStats) {
                setVaultStats({
                    loading: false,
                    error: null,
                    data: result.vaultStats
                });
            }

            // Refresh treasury data after rebalance
            await fetchTreasury();

            return result;
        } catch (err) {
            console.error('[Context] Rebalance failed:', err);
            setVaultStats(prev => ({ ...prev, loading: false, error: 'Rebalance failed' }));
            return null;
        } finally {
            setIsRebalancing(false);
        }
    }, [wallet.address, wallet.risk, signMessage, fetchTreasury]);

    const [isDepositing, setIsDepositing] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);



    const deposit = useCallback(async (amount: number): Promise<boolean> => {
        if (!wallet.address || !sendTransaction) return false;
        setIsDepositing(true);
        try {
            const signatureData = await signMessage("deposit");
            const response = await api.deposit(wallet.address, amount, signatureData || undefined);

            if (response.result?.unsigned_tx_base64) {
                console.log('[Context] Received transaction, prompting signature...');
                const txData = Buffer.from(response.result.unsigned_tx_base64, 'base64');
                const transaction = VersionedTransaction.deserialize(txData);

                const signature = await sendTransaction(transaction, connection);
                console.log('[Context] Transaction sent:', signature);

                // Poll for confirmation (more robust than WebSocket on public RPC)
                console.log('[Context] Polling for confirmation...');

                let confirmed = false;
                for (let i = 0; i < 30; i++) { // Poll for 30 seconds
                    const status = await connection.getSignatureStatus(signature);
                    if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                        confirmed = true;
                        console.log('[Context] Transaction confirmed:', status.value.confirmationStatus);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (!confirmed) {
                    console.log('[Context] Confirmation polling timed out, checking one last time...');
                    const status = await connection.getSignatureStatus(signature);
                    if (status.value?.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
                    }
                }
                console.log('[Context] Transaction confirmed');
            }

            await fetchTreasury();
            return true;
        } catch (error) {
            console.error('[Context] Deposit failed:', error);
            return false;
        } finally {
            setIsDepositing(false);
        }
    }, [wallet.address, signMessage, fetchTreasury, sendTransaction]);

    const withdraw = useCallback(async (amount: number): Promise<boolean> => {
        if (!wallet.address || !sendTransaction) return false;
        setIsWithdrawing(true);
        try {
            const signatureData = await signMessage("withdraw");
            const response = await api.withdraw(wallet.address, amount, signatureData || undefined);

            if (response.result?.unsigned_tx_base64) {
                console.log('[Context] Received transaction, prompting signature...');
                const txData = Buffer.from(response.result.unsigned_tx_base64, 'base64');
                const transaction = VersionedTransaction.deserialize(txData);

                const signature = await sendTransaction(transaction, connection);
                console.log('[Context] Transaction sent:', signature);

                // Poll for confirmation (more robust than WebSocket on public RPC)
                console.log('[Context] Polling for confirmation...');

                let confirmed = false;
                for (let i = 0; i < 30; i++) { // Poll for 30 seconds
                    const status = await connection.getSignatureStatus(signature);
                    if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                        confirmed = true;
                        console.log('[Context] Transaction confirmed:', status.value.confirmationStatus);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (!confirmed) {
                    console.log('[Context] Confirmation polling timed out, checking one last time...');
                    const status = await connection.getSignatureStatus(signature);
                    if (status.value?.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
                    }
                }
                console.log('[Context] Transaction confirmed');
            }

            await fetchTreasury();
            return true;
        } catch (error) {
            console.error('[Context] Withdraw failed:', error);
            // Log more details for WalletSendTransactionError
            if (error instanceof Error) {
                console.error('[Context] Error name:', error.name);
                console.error('[Context] Error message:', error.message);
                if ('logs' in error) {
                    console.error('[Context] Transaction logs:', (error as any).logs);
                }
            }
            return false;
        } finally {
            setIsWithdrawing(false);
        }
    }, [wallet.address, signMessage, fetchTreasury, sendTransaction]);

    const value: ShadowFundContextType = {
        wallet,
        connectWallet,
        disconnectWallet,
        setRiskLevel,
        isSimulationMode,
        treasury,
        fetchTreasury,
        strategy,
        fetchStrategy,
        vaultStats,
        rebalance,
        isRebalancing,
        deposit,
        isDepositing,
        withdraw,
        isWithdrawing,
        signMessage
    };

    return (
        <ShadowFundContext.Provider value={value}>
            {children}
        </ShadowFundContext.Provider>
    );
}

export function useShadowFund(): ShadowFundContextType {
    const context = useContext(ShadowFundContext);
    if (!context) {
        throw new Error("useShadowFund must be used within a ShadowFundProvider");
    }
    return context;
}
