/**
 * Growth Vault Strategy
 * Invests USD1 into blue-chip tokens (SOL, wETH, wBTC) via Jupiter.
 * When server wallet is configured and not on devnet, executes real swaps; otherwise simulates.
 */

import { GrowthStrategy, VaultStatus, StrategyExecutionResult } from "./types";
import { TxResult, Position, TOKENS, GROWTH_ALLOCATION, getRADRDecimals } from "../protocols/types";
import { jupiter } from "../protocols";
import { getVaultAddress } from "../vaults";
import { logger } from "../logger";

const log = (msg: string) => logger.info(msg, "GROWTH");


// In-memory position tracking (in production, use database)
interface GrowthPosition {
    walletAddress: string;
    token: string;
    symbol: string;
    amount: number;
    entryPrice: number;
    entryTimestamp: number;
}

const positions: Map<string, GrowthPosition[]> = new Map();

class GrowthVaultStrategy implements GrowthStrategy {
    vaultId = "growth";
    name = "Growth Vault";
    description = "RADR Labs shielded growth (SOL, RADR, ORE, ANON)";
    riskLevel = "medium" as const;

    async deposit(walletAddress: string, amount: number): Promise<TxResult> {
        log("Distributing into RADR shielded assets");

        // RADR Labs supported tokens only: SOL, RADR, ORE, ANON
        const allocations = [
            { token: TOKENS.SOL, symbol: "SOL", percent: GROWTH_ALLOCATION.SOL },
            { token: TOKENS.RADR, symbol: "RADR", percent: GROWTH_ALLOCATION.RADR },
            { token: TOKENS.ORE, symbol: "ORE", percent: GROWTH_ALLOCATION.ORE },
            { token: TOKENS.ANON, symbol: "ANON", percent: GROWTH_ALLOCATION.ANON },
        ];

        const txSignatures: string[] = [];
        const newPositions: GrowthPosition[] = [];

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
            });

            if (swapResult.success && swapResult.txSignature) {
                txSignatures.push(swapResult.txSignature);
            } else {
                txSignatures.push(`growth_shield_${alloc.symbol.toLowerCase()}_${Date.now()}`);
            }

            log(`Shielding ${alloc.symbol}`);

            newPositions.push({
                walletAddress,
                token: alloc.token,
                symbol: alloc.symbol,
                amount: tokenAmount,
                entryPrice: price,
                entryTimestamp: Date.now()
            });
        }

        // Store positions
        const existingPositions = positions.get(walletAddress) || [];
        positions.set(walletAddress, [...existingPositions, ...newPositions]);

        log("Growth distribution complete");

        return {
            success: true,
            txSignature: txSignatures.join(","),
            timestamp: Date.now()
        };
    }

    async withdraw(walletAddress: string, amount: number): Promise<TxResult & { unsigned_txs?: string[]; totalUSD1?: number }> {
        log("Withdrawing: swapping tokens back to USD1");

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
        let totalUSD1Received = 0;

        for (const pos of currentPositions) {
            const withdrawTokenAmount = pos.amount * sellPercent;
            if (withdrawTokenAmount <= 0.000001) continue;

            log(`Selling ${pos.symbol} → USD1`);

            // Get token decimals
            const decimals = getRADRDecimals(pos.symbol);

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

        return {
            success: true,
            txSignature: txSignatures.join(","),
            unsigned_txs: unsignedTxs.length > 0 ? unsignedTxs : undefined,
            totalUSD1: totalUSD1Received,
            timestamp: Date.now()
        };
    }


    async getBalance(walletAddress: string): Promise<number> {
        // Return the USD value of all positions + uninvested cash
        return await this.getValue(walletAddress);
    }

    async getValue(walletAddress: string): Promise<number> {
        const userPositions = positions.get(walletAddress) || [];

        // GET SHADOWWIRE CASH BALANCE FOR THIS VAULT
        const vaultAddress = await getVaultAddress(walletAddress, "growth");
        const { getPrivateBalance } = await import("../shadowwire");
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
