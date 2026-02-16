/**
 * Vault Strategy Types
 * Interfaces for all vault strategies
 */

import { TxResult, Position, LendingPosition, MemeToken, DegenPosition } from "../protocols/types.js";

// Base strategy interface
export interface VaultStrategy {
    vaultId: string;
    name: string;
    description: string;
    riskLevel: "low" | "medium" | "high";

    // Core operations
    deposit(walletAddress: string, amount: number): Promise<TxResult>;
    withdraw(walletAddress: string, amount: number): Promise<TxResult>;

    // Status
    getBalance(walletAddress: string): Promise<number>;
    getValue(walletAddress: string): Promise<number>;
    getStatus(walletAddress: string): Promise<VaultStatus>;
}

export interface VaultStatus {
    deposited: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
    positions: any[];
    lastUpdated: number;
}

// Reserve vault (simple USD1 holding)
export interface ReserveStrategy extends VaultStrategy {
    // No additional methods - just holds USD1
}

// Yield vault (lending/farming)
export interface YieldStrategy extends VaultStrategy {
    getCurrentAPY(): Promise<number>;
    getEarnedYield(walletAddress: string): Promise<number>;
    compound(walletAddress: string): Promise<TxResult>;
    getPositions(walletAddress: string): Promise<LendingPosition[]>;
}

// Growth vault (blue-chip token exposure)
export interface GrowthStrategy extends VaultStrategy {
    rebalancePortfolio(walletAddress: string): Promise<TxResult>;
    getPositions(walletAddress: string): Promise<Position[]>;
    getPortfolioAllocation(walletAddress: string): Promise<Record<string, number>>;
}

// Degen vault (meme coin trading)
export interface DegenStrategy extends VaultStrategy {
    scanOpportunities(): Promise<MemeToken[]>;
    enterPosition(walletAddress: string, token: MemeToken, amount: number): Promise<TxResult>;
    exitPosition(walletAddress: string, tokenAddress: string): Promise<TxResult>;
    getActivePositions(walletAddress: string): Promise<DegenPosition[]>;
    setStopLoss(walletAddress: string, tokenAddress: string, percent: number): Promise<void>;
}

// RWA vault (tokenized precious metals)
export interface RwaStrategy extends VaultStrategy {
    getPositions(walletAddress: string): Promise<Position[]>;
}

// Strategy execution result
export interface StrategyExecutionResult {
    vaultId: string;
    success: boolean;
    amountIn: number;
    amountOut?: number;
    txSignatures: string[];
    unsignedTxs?: string[];
    positions?: any[];
    error?: string;
    timestamp: number;
}

// Combined vault stats
export interface VaultStats {
    reserve: {
        balance: number;
        percentage: number;
    };
    yield: {
        balance: number;
        percentage: number;
        apy: number;
        earned: number;
    };
    growth: {
        balance: number;
        percentage: number;
        positions: Position[];
        pnl: number;
    };
    degen: {
        balance: number;
        percentage: number;
        positions: DegenPosition[];
        pnl: number;
    };
    rwa: {
        balance: number;
        percentage: number;
        positions: Position[];
        pnl: number;
    };
    total: number;
}
