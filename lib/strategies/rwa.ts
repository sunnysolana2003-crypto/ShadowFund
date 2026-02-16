/**
 * RWA Vault Strategy
 * Tokenized precious metals via Remora Markets (GLDr, SLVr, CPERr).
 *
 * POSITION PERSISTENCE: Uses Solana Memo Program for on-chain storage.
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { RwaStrategy, VaultStatus, StrategyExecutionResult } from "./types.js";
import { TxResult, Position, TOKENS, RWA_TOKENS, getRADRDecimals } from "../protocols/types.js";
import { jupiter } from "../protocols/index.js";
import { getVaultAddress } from "../vaults.js";
import { logger } from "../logger.js";
import {
    reconstructPositions,
    PositionMemo,
    buildPositionMemoTransaction
} from "../positionMemo.js";

const log = (msg: string) => logger.info(msg, "RWA");

const getRpcUrl = () => process.env.SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");
const connection = new Connection(getRpcUrl(), "confirmed");

interface RwaPositionInternal {
    walletAddress: string;
    token: string;
    symbol: string;
    amount: number;
    entryPrice: number;
    entryTimestamp: number;
}

const positions: Map<string, RwaPositionInternal[]> = new Map();
const positionsLoaded: Set<string> = new Set();
const pendingMemos: Map<string, PositionMemo[]> = new Map();

function getRwaTokenMeta(symbol: string) {
    return RWA_TOKENS.find(t => t.symbol === symbol);
}

class RwaVaultStrategy implements RwaStrategy {
    vaultId = "rwa";
    name = "RWA Vault";
    description = "Private tokenized precious metals via Remora Markets";
    riskLevel = "low" as const;

    async loadPositionsFromChain(walletAddress: string): Promise<void> {
        if (positionsLoaded.has(walletAddress)) return;

        try {
            log("Loading positions from on-chain memos...");
            const onChainPositions = await reconstructPositions(connection, walletAddress, "rwa");

            if (onChainPositions.length > 0) {
                const loadedPositions: RwaPositionInternal[] = onChainPositions.map(p => ({
                    walletAddress,
                    token: p.tokenMint,
                    symbol: p.tokenSymbol,
                    amount: p.amount,
                    entryPrice: p.entryPrice,
                    entryTimestamp: p.openedAt
                }));

                positions.set(walletAddress, loadedPositions);
                log(`Loaded ${loadedPositions.length} RWA positions from blockchain`);
            }

            positionsLoaded.add(walletAddress);
        } catch {
            log("Failed to load from chain, using empty positions");
            positionsLoaded.add(walletAddress);
        }
    }

    getPendingMemos(walletAddress: string): PositionMemo[] {
        return pendingMemos.get(walletAddress) || [];
    }

    clearPendingMemos(walletAddress: string): void {
        pendingMemos.delete(walletAddress);
    }

    async deposit(
        walletAddress: string,
        amount: number
    ): Promise<TxResult & { positionMemos?: PositionMemo[]; memo_tx_base64?: string }> {
        log("Deploying into RWA assets");

        await this.loadPositionsFromChain(walletAddress);

        const txSignatures: string[] = [];
        const newPositions: RwaPositionInternal[] = [];
        const memos: PositionMemo[] = [];

        const perAsset = amount / RWA_TOKENS.length;

        for (const asset of RWA_TOKENS) {
            const investAmount = perAsset;
            if (investAmount <= 0) continue;

            const price = await jupiter.getTokenPrice(asset.token);
            if (!price || price <= 0) {
                log(`Warning: Could not get price for ${asset.symbol}, skipping.`);
                continue;
            }

            const tokenAmount = investAmount / price;
            if (tokenAmount < asset.min) {
                log(`Skipping ${asset.symbol}: below minimum (${asset.min})`);
                continue;
            }

            const swapResult = await jupiter.executeSwap({
                inputMint: TOKENS.USD1,
                outputMint: asset.token,
                amount: investAmount,
                slippageBps: 80
            }, walletAddress);

            if (swapResult.success && swapResult.txSignature) {
                txSignatures.push(swapResult.txSignature);
            } else {
                txSignatures.push(`rwa_buy_${asset.symbol.toLowerCase()}_${Date.now()}`);
            }

            const existingPos = (positions.get(walletAddress) || []).find(p => p.token === asset.token);
            const memo: PositionMemo = {
                vault: "rwa",
                action: existingPos ? "add" : "open",
                tokenSymbol: asset.symbol,
                tokenMint: asset.token,
                amount: tokenAmount,
                priceUSD: price,
                timestamp: Date.now()
            };
            memos.push(memo);

            newPositions.push({
                walletAddress,
                token: asset.token,
                symbol: asset.symbol,
                amount: tokenAmount,
                entryPrice: price,
                entryTimestamp: Date.now()
            });
        }

        const existing = positions.get(walletAddress) || [];
        for (const newPos of newPositions) {
            const existingPos = existing.find(p => p.token === newPos.token);
            if (existingPos) {
                const totalAmount = existingPos.amount + newPos.amount;
                existingPos.entryPrice =
                    (existingPos.entryPrice * existingPos.amount + newPos.entryPrice * newPos.amount) / totalAmount;
                existingPos.amount = totalAmount;
            } else {
                existing.push(newPos);
            }
        }
        positions.set(walletAddress, existing);

        pendingMemos.set(walletAddress, memos);

        let memoTxBase64: string | undefined;
        if (memos.length > 0) {
            try {
                const walletPubkey = new PublicKey(walletAddress);
                const memoTx = await buildPositionMemoTransaction(connection, walletPubkey, memos);
                const serialized = memoTx.serialize({ requireAllSignatures: false });
                memoTxBase64 = serialized.toString("base64");
            } catch {
                log("Memo transaction build failed");
            }
        }

        return {
            success: true,
            txSignature: txSignatures.join(","),
            positionMemos: memos,
            memo_tx_base64: memoTxBase64,
            timestamp: Date.now()
        };
    }

    async withdraw(
        walletAddress: string,
        amount: number
    ): Promise<TxResult & { unsigned_txs?: string[]; totalUSD1?: number; positionMemos?: PositionMemo[] }> {
        log("Withdrawing: swapping RWAs back to USD1");

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

            const meta = getRwaTokenMeta(pos.symbol);
            if (meta && withdrawTokenAmount < meta.min) {
                log(`Skipping ${pos.symbol} withdraw: below minimum (${meta.min})`);
                continue;
            }

            const decimals = meta?.decimals ?? getRADRDecimals(pos.symbol);
            const currentPrice = await jupiter.getTokenPrice(pos.token);

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

                const isClosingFully = pos.amount - withdrawTokenAmount < 0.000001;
                const memo: PositionMemo = {
                    vault: "rwa",
                    action: isClosingFully ? "close" : "reduce",
                    tokenSymbol: pos.symbol,
                    tokenMint: pos.token,
                    amount: withdrawTokenAmount,
                    priceUSD: currentPrice || pos.entryPrice,
                    timestamp: Date.now()
                };
                memos.push(memo);

                pos.amount -= withdrawTokenAmount;
            } else {
                log(`Warning: Failed to sell ${pos.symbol}: ${swapResult.error}`);
            }
        }

        positions.set(walletAddress, currentPositions.filter(p => p.amount > 0.000001));

        const existingMemos = pendingMemos.get(walletAddress) || [];
        pendingMemos.set(walletAddress, [...existingMemos, ...memos]);

        if (memos.length > 0) {
            try {
                const walletPubkey = new PublicKey(walletAddress);
                const memoTx = await buildPositionMemoTransaction(connection, walletPubkey, memos);
                const serialized = memoTx.serialize({ requireAllSignatures: false });
                unsignedTxs.push(serialized.toString("base64"));
            } catch {
                log("Memo transaction build failed");
            }
        }

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
        return await this.getValue(walletAddress);
    }

    async getValue(walletAddress: string): Promise<number> {
        await this.loadPositionsFromChain(walletAddress);

        const userPositions = positions.get(walletAddress) || [];
        const vaultAddress = await getVaultAddress(walletAddress, "rwa");
        const { getPrivateBalance } = await import("../shadowwire.js");
        const cashBalance = await getPrivateBalance(vaultAddress);

        if (userPositions.length === 0) return cashBalance;

        const prices = await jupiter.getTokenPrices(userPositions.map(p => p.token));
        let totalValue = cashBalance;

        for (const pos of userPositions) {
            const price = prices[pos.token] || pos.entryPrice;
            totalValue += pos.amount * price;
        }

        return totalValue;
    }

    async getPositions(walletAddress: string): Promise<Position[]> {
        const userPositions = positions.get(walletAddress) || [];
        const prices = await jupiter.getTokenPrices(userPositions.map(p => p.token));

        return userPositions.map(pos => {
            const currentPrice = prices[pos.token] || pos.entryPrice;
            const valueUSD = pos.amount * currentPrice;
            const pnl = (currentPrice - pos.entryPrice) * pos.amount;
            const pnlPercent = pos.entryPrice > 0 ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 : 0;

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

export const rwaStrategy = new RwaVaultStrategy();

export async function executeRwaStrategy(
    walletAddress: string,
    targetAmount: number
): Promise<StrategyExecutionResult> {
    log("Executing strategy");

    const currentValue = await rwaStrategy.getValue(walletAddress);
    const difference = targetAmount - currentValue;

    const txSignatures: string[] = [];
    const unsignedTxs: string[] = [];

    if (difference > 1) {
        log("Buying RWAs");
        const depositResult = await rwaStrategy.deposit(walletAddress, difference);
        if (depositResult.txSignature) {
            txSignatures.push(...depositResult.txSignature.split(","));
        }
        if ((depositResult as any).memo_tx_base64) {
            unsignedTxs.push((depositResult as any).memo_tx_base64);
        }
    } else if (difference < -1) {
        log("Selling RWAs");
        const withdrawResult = await rwaStrategy.withdraw(walletAddress, Math.abs(difference));
        if (withdrawResult.txSignature) {
            txSignatures.push(...withdrawResult.txSignature.split(","));
        }
        if (withdrawResult.unsigned_txs && withdrawResult.unsigned_txs.length > 0) {
            unsignedTxs.push(...withdrawResult.unsigned_txs);
        }
    }

    const finalValue = await rwaStrategy.getValue(walletAddress);
    const positionsList = await rwaStrategy.getPositions(walletAddress);

    return {
        vaultId: "rwa",
        success: true,
        amountIn: targetAmount,
        amountOut: finalValue,
        txSignatures: txSignatures.filter(Boolean),
        unsignedTxs: unsignedTxs.length > 0 ? unsignedTxs : undefined,
        positions: positionsList,
        timestamp: Date.now()
    };
}
