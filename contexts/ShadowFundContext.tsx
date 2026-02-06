import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, VersionedTransaction, Transaction, clusterApiUrl } from '@solana/web3.js';
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
    wallet: WalletState;
    connectWallet: (address: string) => void;
    disconnectWallet: () => void;
    setRiskLevel: (risk: "low" | "medium" | "high") => void;
    isSimulationMode: boolean;
    treasury: TreasuryState;
    fetchTreasury: (overrideAddress?: string) => Promise<void>;
    strategy: StrategyState;
    fetchStrategy: () => Promise<void>;
    vaultStats: VaultStatsState;
    rebalance: () => Promise<RebalanceResult | null>;
    isRebalancing: boolean;
    deposit: (amount: number) => Promise<boolean>;
    isDepositing: boolean;
    withdraw: (amount: number) => Promise<boolean>;
    isWithdrawing: boolean;
    withdrawFromVault: (vault: "reserve" | "yield" | "growth" | "degen", amount: number) => Promise<boolean>;
    isWithdrawingFromVault: string | null;
    signMessage: (message: string) => Promise<{ signature: string; timestamp: number } | null>;
}

const ShadowFundContext = createContext<ShadowFundContextType | null>(null);

const rpcUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SOLANA_RPC_URL) || clusterApiUrl('mainnet-beta');
const connection = new Connection(rpcUrl, "confirmed");

export function ShadowFundProvider({ children }: { children: ReactNode }) {
    const { publicKey, signMessage: walletSignMessage, connected, sendTransaction } = useWallet();

    const isSimulationMode =
        (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SHADOWWIRE_MOCK === "true") ||
        false;

    const [wallet, setWallet] = useState<WalletState>({
        connected: false,
        address: null,
        solBalance: 0,
        risk: "medium"
    });

    const [treasury, setTreasury] = useState<TreasuryState>({
        loading: false,
        error: null,
        data: null
    });

    const [strategy, setStrategy] = useState<StrategyState>({
        loading: false,
        error: null,
        data: null
    });

    const [vaultStats, setVaultStats] = useState<VaultStatsState>({
        loading: false,
        error: null,
        data: null
    });

    const [isRebalancing, setIsRebalancing] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isWithdrawingFromVault, setIsWithdrawingFromVault] = useState<string | null>(null);

    const sendUnsignedTransaction = useCallback(async (base64Tx: string) => {
        if (!sendTransaction) {
            throw new Error("Wallet not ready to sign transactions");
        }

        const txData = Buffer.from(base64Tx, 'base64');
        let transaction: VersionedTransaction | Transaction;

        try {
            transaction = VersionedTransaction.deserialize(txData);
        } catch {
            transaction = Transaction.from(txData);
        }

        const signature = await sendTransaction(transaction, connection);

        for (let i = 0; i < 30; i++) {
            const status = await connection.getSignatureStatus(signature);
            if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return signature;
    }, [sendTransaction]);

    useEffect(() => {
        let isMounted = true;

        if (connected && publicKey) {
            setWallet(prev => ({
                ...prev,
                connected: true,
                address: publicKey.toBase58()
            }));

            const fetchBalance = async () => {
                try {
                    const balance = await connection.getBalance(publicKey);
                    if (isMounted) {
                        setWallet(prev => ({ ...prev, solBalance: balance / 1e9 }));
                    }
                } catch (err: any) {
                    console.warn("Solana RPC rate limited or blocked (403). Using cached balance.", err.message);
                    if (isMounted) {
                        setWallet(prev => ({ ...prev, solBalance: 0 }));
                    }
                }
            };

            fetchBalance();
        }

        return () => { isMounted = false; };
    }, [connected, publicKey]);

    const connectWallet = useCallback((address: string) => {
        setWallet(prev => ({ ...prev, connected: true, address }));
    }, []);

    const disconnectWallet = useCallback(() => {
        setWallet({ connected: false, address: null, solBalance: 0, risk: "medium" });
        setTreasury({ loading: false, error: null, data: null });
        setStrategy({ loading: false, error: null, data: null });
    }, []);

    const setRiskLevel = useCallback((risk: "low" | "medium" | "high") => {
        setWallet(prev => ({ ...prev, risk }));
    }, []);

    const signMessage = useCallback(async (action: string): Promise<{ signature: string; timestamp: number } | null> => {
        if (!wallet.address || !walletSignMessage) return null;
        try {
            const timestamp = Date.now();
            const message = `${action}|${wallet.address}|${timestamp}`;
            const encoded = new TextEncoder().encode(message);
            const signatureBytes = await walletSignMessage(encoded);
            return { signature: bs58.encode(signatureBytes), timestamp };
        } catch {
            return null;
        }
    }, [wallet.address, walletSignMessage]);

    const fetchTreasury = useCallback(async (overrideAddress?: string) => {
        const address = overrideAddress ?? wallet.address;
        if (!address) return;

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

    const fetchStrategy = useCallback(async () => {
        setStrategy(prev => ({ ...prev, loading: true, error: null }));
        try {
            const data = await api.getStrategy(wallet.risk);
            setStrategy({ loading: false, error: null, data });
        } catch (err) {
            setStrategy({
                loading: false,
                error: err instanceof Error ? err.message : "Failed to fetch strategy",
                data: null
            });
        }
    }, [wallet.risk]);

    const rebalance = useCallback(async (): Promise<RebalanceResult | null> => {
        if (!wallet.address) return null;

        setIsRebalancing(true);
        setVaultStats(prev => ({ ...prev, loading: true }));

        try {
            const signatureData = await signMessage("rebalance");
            const result = await api.rebalance(
                wallet.address,
                wallet.risk,
                signatureData ? { ...signatureData, action: "rebalance" } : undefined
            );

            if (result.execution?.unsignedTxs && result.execution.unsignedTxs.length > 0) {
                for (const unsignedTx of result.execution.unsignedTxs) {
                    await sendUnsignedTransaction(unsignedTx);
                }
            }

            if (result.vaultStats) {
                setVaultStats({ loading: false, error: null, data: result.vaultStats });
            }

            await fetchTreasury();
            return result;
        } catch {
            setVaultStats(prev => ({ ...prev, loading: false, error: 'Rebalance failed' }));
            return null;
        } finally {
            setIsRebalancing(false);
        }
    }, [wallet.address, wallet.risk, signMessage, fetchTreasury, sendUnsignedTransaction]);

    const deposit = useCallback(async (amount: number): Promise<boolean> => {
        if (!wallet.address || !sendTransaction) return false;
        setIsDepositing(true);
        try {
            const signatureData = await signMessage("deposit");
            const response = await api.deposit(wallet.address, amount, signatureData || undefined);

            if (response.result?.unsigned_tx_base64) {
                await sendUnsignedTransaction(response.result.unsigned_tx_base64);
            }

            await fetchTreasury();
            return true;
        } catch {
            return false;
        } finally {
            setIsDepositing(false);
        }
    }, [wallet.address, signMessage, fetchTreasury, sendUnsignedTransaction]);

    const withdraw = useCallback(async (amount: number): Promise<boolean> => {
        if (!wallet.address || !sendTransaction) return false;
        setIsWithdrawing(true);
        try {
            const signatureData = await signMessage("withdraw");
            const response = await api.withdraw(wallet.address, amount, signatureData || undefined);

            if (response.result?.unsigned_tx_base64) {
                await sendUnsignedTransaction(response.result.unsigned_tx_base64);
            }

            await fetchTreasury();
            return true;
        } catch {
            return false;
        } finally {
            setIsWithdrawing(false);
        }
    }, [wallet.address, signMessage, fetchTreasury, sendUnsignedTransaction]);

    const withdrawFromVault = useCallback(async (
        vault: "reserve" | "yield" | "growth" | "degen",
        amount: number
    ): Promise<boolean> => {
        if (!wallet.address || !sendTransaction) return false;
        setIsWithdrawingFromVault(vault);
        try {
            const signatureData = await signMessage(`vault-withdraw-${vault}`);
            const response = await api.withdrawFromVault(wallet.address, vault, amount, signatureData || undefined);

            // Handle unsigned transactions that need user signing
            if (response.unsigned_txs && response.unsigned_txs.length > 0) {
                for (const unsignedTx of response.unsigned_txs) {
                    await sendUnsignedTransaction(unsignedTx);
                }
            }

            await fetchTreasury();
            return true;
        } catch {
            return false;
        } finally {
            setIsWithdrawingFromVault(null);
        }
    }, [wallet.address, signMessage, fetchTreasury, sendUnsignedTransaction]);

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
        withdrawFromVault,
        isWithdrawingFromVault,
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
