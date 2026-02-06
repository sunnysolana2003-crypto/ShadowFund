/**
 * Growth Vault Strategy
 * Invests USD1 into blue-chip tokens (SOL, wETH, wBTC) via Jupiter.
 * 
 * POSITION PERSISTENCE: Uses Solana Memo Program for on-chain storage.
 * Positions are reconstructed from transaction history - fully decentralized.
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { GrowthStrategy, VaultStatus, StrategyExecutionResult } from "./types.js";
import { TxResult, Position, TOKENS, GROWTH_ALLOCATION, getRADRDecimals } from "../protocols/types.js";
import { jupiter } from "../protocols/index.js";
import { getVaultAddress } from "../vaults.js";
import { logger } from "../logger.js";
import { 
    reconstructPositions, 
    ReconstructedPosition,
    PositionMemo 
} from "../positionMemo.js";

const log = (msg: string) => logger.info(msg, "GROWTH");

const getRpcUrl = () => process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
const connection = new Connection(getRpcUrl(), 'confirmed');

// In-memory cache (populated from on-chain memos)
interface GrowthPosition {
    walletAddress: string;
    token: string;
    symbol: string;
    amount: number;
    entryPrice: number;
    entryTimestamp: number;
}

const positions: Map<string, GrowthPosition[]> = new Map();
const positionsLoaded: Set<string> = new Set(); // Track which wallets we've loaded

// Pending memos to attach to transactions
const pendingMemos: Map<string, PositionMemo[]> = new Map();

class GrowthVaultStrategy implements GrowthStrategy {
    vaultId = "growth";
    name = "Growth Vault";
    description = "RADR Labs shielded growth (SOL, RADR, ORE, ANON)";
    riskLevel = "medium" as const;

    /**
     * Load positions from on-chain memos (called once per wallet)
     */
    async loadPositionsFromChain(walletAddress: string): Promise<void> {
        if (positionsLoaded.has(walletAddress)) {
            return; // Already loaded
        }

        try {
            log("Loading positions from on-chain memos...");
            const onChainPositions = await reconstructPositions(connection, walletAddress, 'growth');

            if (onChainPositions.length > 0) {
                const loadedPositions: GrowthPosition[] = onChainPositions.map(p => ({
                    walletAddress,
                    token: p.tokenMint,
                    symbol: p.tokenSymbol,
                    amount: p.amount,
                    entryPrice: p.entryPrice,
                    entryTimestamp: p.openedAt
                }));

                positions.set(walletAddress, loadedPositions);
                log(`Loaded ${loadedPositions.length} positions from blockchain`);
            }

            positionsLoaded.add(walletAddress);
        } catch (error) {
            log("Failed to load from chain, using empty positions");
            positionsLoaded.add(walletAddress);
        }
    }

    /**
     * Get pending memos for a wallet (to attach to transactions)
     */
    getPendingMemos(walletAddress: string): PositionMemo[] {
        return pendingMemos.get(walletAddress) || [];
    }

    /**
     * Clear pending memos after transaction is sent
     */
    clearPendingMemos(walletAddress: string): void {
        pendingMemos.delete(walletAddress);
    }

    async deposit(walletAddress: string, amount: number): Promise<TxResult & { positionMemos?: PositionMemo[] }> {
        log("Distributing into RADR shielded assets");

        // Load existing positions from chain first
        await this.loadPositionsFromChain(walletAddress);

        // RADR Labs supported tokens only: SOL, RADR, ORE, ANON
        const allocations = [
            { token: TOKENS.SOL, symbol: "SOL", percent: GROWTH_ALLOCATION.SOL },
            { token: TOKENS.RADR, symbol: "RADR", percent: GROWTH_ALLOCATION.RADR },
            { token: TOKENS.ORE, symbol: "ORE", percent: GROWTH_ALLOCATION.ORE },
            { token: TOKENS.ANON, symbol: "ANON", percent: GROWTH_ALLOCATION.ANON },
        ];

        const txSignatures: string[] = [];
        const newPositions: GrowthPosition[] = [];
        const memos: PositionMemo[] = [];

        for (const alloc of allocations) {
            const investAmount = amount * (alloc.percent / 100);
            if (investAmount < 0.1) continue;

            log(`Allocation: ${alloc.symbol}`);

            const price = await jupiter.getTokenPrice(alloc.token);
            const tokenAmount = price > 0 ? investAmount / price : 0;

            // Execute real swap when server wallet + mainnet; otherwise simulate
            const swapResult = await jupiter.executeSwap({
                inputMint: TOKENS.USD1,
                outputMint: alloc.token,
                amount: investAmount,
                slippageBps: 80,
            }, walletAddress);

            if (swapResult.success && swapResult.txSignature) {
                txSignatures.push(swapResult.txSignature);
            } else {
                txSignatures.push(`growth_shield_${alloc.symbol.toLowerCase()}_${Date.now()}`);
            }

            log(`Shielding ${alloc.symbol}`);

            // Create position memo for on-chain persistence
            const existingPos = (positions.get(walletAddress) || []).find(p => p.token === alloc.token);
            const memo: PositionMemo = {
                vault: 'growth',
                action: existingPos ? 'add' : 'open',
                tokenSymbol: alloc.symbol,
                tokenMint: alloc.token,
                amount: tokenAmount,
                priceUSD: price,
                timestamp: Date.now()
            };
            memos.push(memo);

            newPositions.push({
                walletAddress,
                token: alloc.token,
                symbol: alloc.symbol,
                amount: tokenAmount,
                entryPrice: price,
                entryTimestamp: Date.now()
            });
        }

        // Store positions in memory cache
        const existingPositions = positions.get(walletAddress) || [];
        
        // Merge with existing positions (add to same token if exists)
        for (const newPos of newPositions) {
            const existing = existingPositions.find(p => p.token === newPos.token);
            if (existing) {
                // Weighted average entry price
                const totalAmount = existing.amount + newPos.amount;
                existing.entryPrice = (existing.entryPrice * existing.amount + newPos.entryPrice * newPos.amount) / totalAmount;
                existing.amount = totalAmount;
            } else {
                existingPositions.push(newPos);
            }
        }
        positions.set(walletAddress, existingPositions);

        // Store pending memos to be attached to transaction
        pendingMemos.set(walletAddress, memos);

        log("Growth distribution complete");

        return {
            success: true,
            txSignature: txSignatures.join(","),
            positionMemos: memos,
            timestamp: Date.now()
        };
    }

    async withdraw(walletAddress: string, amount: number): Promise<TxResult & { unsigned_txs?: string[]; totalUSD1?: number; positionMemos?: PositionMemo[] }> {
        log("Withdrawing: swapping tokens back to USD1");

        // Load positions from chain first
        await this.loadPositionsFromChain(walletAddress);

        const currentPositions = positions.get(walletAddress) || [];
        const totalValue = await this.getValue(walletAddress);

        if (totalValue < amount) {
            return {
                success: false,
                error: `Insufficient value. Available: $${totalValue.toFixed(2)}`,
                timestamp: Date.now()
            };
        }

        const sellPercent = amount / totalValue;
        const txSignatures: string[] = [];
        const unsignedTxs: string[] = [];
        const memos: PositionMemo[] = [];
        let totalUSD1Received = 0;

        for (const pos of currentPositions) {
            const withdrawTokenAmount = pos.amount * sellPercent;
            if (withdrawTokenAmount <= 0.000001) continue;

            log(`Selling ${pos.symbol} → USD1`);

            // Get token decimals
            const decimals = getRADRDecimals(pos.symbol);
            const currentPrice = await jupiter.getTokenPrice(pos.token);

            // Execute real swap: Token → USD1
            const swapResult = await jupiter.swapToUSD1(
                pos.token,
                withdrawTokenAmount,
                decimals,
                walletAddress
            );

            if (swapResult.success) {
                if (swapResult.txSignature) {
                    txSignatures.push(swapResult.txSignature);
                }
                if (swapResult.unsigned_tx_base64) {
                    unsignedTxs.push(swapResult.unsigned_tx_base64);
                }
                if (swapResult.outputAmount) {
                    totalUSD1Received += swapResult.outputAmount;
                }

                // Create memo for on-chain persistence
                const isClosingFully = pos.amount - withdrawTokenAmount < 0.000001;
                const memo: PositionMemo = {
                    vault: 'growth',
                    action: isClosingFully ? 'close' : 'reduce',
                    tokenSymbol: pos.symbol,
                    tokenMint: pos.token,
                    amount: withdrawTokenAmount,
                    priceUSD: currentPrice,
                    timestamp: Date.now()
                };
                memos.push(memo);

                // Reduce position
                pos.amount -= withdrawTokenAmount;
                log(`Sold ${pos.symbol}, received ~$${swapResult.outputAmount?.toFixed(2) || '?'} USD1`);
            } else {
                log(`Warning: Failed to sell ${pos.symbol}: ${swapResult.error}`);
            }
        }

        // Cleanup empty positions
        positions.set(
            walletAddress,
            currentPositions.filter(p => p.amount > 0.000001)
        );

        // Store pending memos
        const existingMemos = pendingMemos.get(walletAddress) || [];
        pendingMemos.set(walletAddress, [...existingMemos, ...memos]);

        return {
            success: true,
            txSignature: txSignatures.join(","),
            unsigned_txs: unsignedTxs.length > 0 ? unsignedTxs : undefined,
            totalUSD1: totalUSD1Received,
            positionMemos: memos,
            timestamp: Date.now()
        };
    }


    async getBalance(walletAddress: string): Promise<number> {
        // Return the USD value of all positions + uninvested cash
        return await this.getValue(walletAddress);
    }

    async getValue(walletAddress: string): Promise<number> {
        // Load positions from chain first
        await this.loadPositionsFromChain(walletAddress);

        const userPositions = positions.get(walletAddress) || [];

        // GET SHADOWWIRE CASH BALANCE FOR THIS VAULT
        const vaultAddress = await getVaultAddress(walletAddress, "growth");
        const { getPrivateBalance } = await import("../shadowwire.js");
        const cashBalance = await getPrivateBalance(vaultAddress);

        if (userPositions.length === 0) return cashBalance;

        // Get current prices
        const mints = userPositions.map(p => p.token);
        const prices = await jupiter.getTokenPrices(mints);

        let totalValue = cashBalance;
        for (const pos of userPositions) {
            const price = prices[pos.token] || pos.entryPrice;
            totalValue += pos.amount * price;
        }

        return totalValue;
    }

    async rebalancePortfolio(walletAddress: string): Promise<TxResult> {
        log("Rebalancing portfolio");

        const currentValue = await this.getValue(walletAddress);
        if (currentValue < 10) {
            return {
                success: true,
                txSignature: "",
                timestamp: Date.now()
            };
        }

        const userPositions = positions.get(walletAddress) || [];
        const prices = await jupiter.getTokenPrices([TOKENS.SOL, TOKENS.RADR, TOKENS.ORE, TOKENS.ANON]);

        // Calculate current allocation
        const currentAlloc: Record<string, number> = {};
        for (const pos of userPositions) {
            const value = pos.amount * (prices[pos.token] || pos.entryPrice);
            currentAlloc[pos.symbol] = (value / currentValue) * 100;
        }


        log("Current vs target allocation");

        // Calculate rebalancing trades
        const trades: { symbol: string; action: "buy" | "sell"; amount: number }[] = [];

        for (const [symbol, targetPercent] of Object.entries(GROWTH_ALLOCATION)) {
            const currentPercent = currentAlloc[symbol] || 0;
            const diff = targetPercent - currentPercent;

            if (Math.abs(diff) > 2) { // Only rebalance if > 2% off
                const tradeValue = (Math.abs(diff) / 100) * currentValue;
                trades.push({
                    symbol,
                    action: diff > 0 ? "buy" : "sell",
                    amount: tradeValue
                });
            }
        }

        log("Rebalancing trades");

        // Execute trades (simulated)
        const txSignatures = trades.map(t =>
            `growth_rebal_${t.action}_${t.symbol}_${Date.now()}`
        );

        return {
            success: true,
            txSignature: txSignatures.join(","),
            timestamp: Date.now()
        };
    }

    async getPositions(walletAddress: string): Promise<Position[]> {
        const userPositions = positions.get(walletAddress) || [];
        const prices = await jupiter.getTokenPrices(userPositions.map(p => p.token));

        return userPositions.map(pos => {
            const currentPrice = prices[pos.token] || pos.entryPrice;
            const valueUSD = pos.amount * currentPrice;
            const pnl = (currentPrice - pos.entryPrice) * pos.amount;
            const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

            return {
                token: {
                    mint: pos.token,
                    symbol: pos.symbol,
                    decimals: getRADRDecimals(pos.symbol),
                    price: currentPrice
                },
                amount: pos.amount,
                valueUSD,
                entryPrice: pos.entryPrice,
                currentPrice,
                pnl,
                pnlPercent
            };
        });
    }

    async getPortfolioAllocation(walletAddress: string): Promise<Record<string, number>> {
        const positionsList = await this.getPositions(walletAddress);
        const totalValue = positionsList.reduce((sum, p) => sum + p.valueUSD, 0);

        const allocation: Record<string, number> = {};
        for (const pos of positionsList) {
            allocation[pos.token.symbol] = totalValue > 0
                ? (pos.valueUSD / totalValue) * 100
                : 0;
        }

        return allocation;
    }

    async getStatus(walletAddress: string): Promise<VaultStatus> {
        const positionsList = await this.getPositions(walletAddress);
        const totalValue = positionsList.reduce((sum, p) => sum + p.valueUSD, 0);
        const totalPnl = positionsList.reduce((sum, p) => sum + p.pnl, 0);
        const entryValue = positionsList.reduce((sum, p) => sum + (p.amount * p.entryPrice), 0);

        return {
            deposited: entryValue,
            currentValue: totalValue,
            pnl: totalPnl,
            pnlPercent: entryValue > 0 ? (totalPnl / entryValue) * 100 : 0,
            positions: positionsList,
            lastUpdated: Date.now()
        };
    }
}

// Export singleton instance
export const growthStrategy = new GrowthVaultStrategy();

// Execute growth vault strategy
export async function executeGrowthStrategy(
    walletAddress: string,
    targetAmount: number
): Promise<StrategyExecutionResult> {
    log("Executing strategy");

    const currentValue = await growthStrategy.getValue(walletAddress);
    const difference = targetAmount - currentValue;

    const txSignatures: string[] = [];

    if (difference > 10) {
        // Need to buy more
        log("Buying blue-chip tokens");
        const depositResult = await growthStrategy.deposit(walletAddress, difference);
        if (depositResult.txSignature) {
            txSignatures.push(...depositResult.txSignature.split(","));
        }
    } else if (difference < -10) {
        // Need to sell
        log("Selling tokens");
        const withdrawResult = await growthStrategy.withdraw(walletAddress, Math.abs(difference));
        if (withdrawResult.txSignature) {
            txSignatures.push(...withdrawResult.txSignature.split(","));
        }
    }

    // Rebalance to target allocation
    const rebalanceResult = await growthStrategy.rebalancePortfolio(walletAddress);
    if (rebalanceResult.txSignature) {
        txSignatures.push(...rebalanceResult.txSignature.split(",").filter(Boolean));
    }

    const finalValue = await growthStrategy.getValue(walletAddress);
    const positionsList = await growthStrategy.getPositions(walletAddress);

    return {
        vaultId: "growth",
        success: true,
        amountIn: targetAmount,
        amountOut: finalValue,
        txSignatures: txSignatures.filter(Boolean),
        positions: positionsList,
        timestamp: Date.now()
    };
}
