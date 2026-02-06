/**
 * Position Memo System
 * 
 * Stores position data on-chain using Solana's Memo Program.
 * Positions are fully decentralized and permanent - no database needed.
 * 
 * Memo format: SHADOWFUND|{vault}|{action}|{token}|{amount}|{price}|{timestamp}
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';
import { logger } from './logger.js';

const MEMO_PREFIX = 'SHADOWFUND';
const log = (msg: string) => logger.info(msg, 'PositionMemo');

// Position data stored in memo
export interface PositionMemo {
    vault: 'growth' | 'degen';
    action: 'open' | 'close' | 'add' | 'reduce';
    tokenSymbol: string;
    tokenMint: string;
    amount: number;
    priceUSD: number;
    timestamp: number;
    signature?: string;
}

// Reconstructed position from memos
export interface ReconstructedPosition {
    tokenMint: string;
    tokenSymbol: string;
    amount: number;
    entryPrice: number;  // Weighted average
    totalCost: number;
    openedAt: number;
}

/**
 * Create a memo instruction for a position action
 */
export function createPositionMemoInstruction(
    wallet: PublicKey,
    data: Omit<PositionMemo, 'signature'>
): TransactionInstruction {
    const memoString = [
        MEMO_PREFIX,
        data.vault,
        data.action,
        data.tokenSymbol,
        data.tokenMint,
        data.amount.toFixed(8),
        data.priceUSD.toFixed(6),
        data.timestamp.toString()
    ].join('|');

    return createMemoInstruction(memoString, [wallet]);
}

/**
 * Add position memo to an existing transaction
 */
export function addPositionMemoToTransaction(
    transaction: Transaction,
    wallet: PublicKey,
    data: Omit<PositionMemo, 'signature'>
): Transaction {
    const memoIx = createPositionMemoInstruction(wallet, data);
    transaction.add(memoIx);
    return transaction;
}

/**
 * Parse a memo string back to PositionMemo
 */
function parseMemoString(memo: string, signature: string): PositionMemo | null {
    try {
        const parts = memo.split('|');
        if (parts.length < 8 || parts[0] !== MEMO_PREFIX) {
            return null;
        }

        return {
            vault: parts[1] as 'growth' | 'degen',
            action: parts[2] as 'open' | 'close' | 'add' | 'reduce',
            tokenSymbol: parts[3],
            tokenMint: parts[4],
            amount: parseFloat(parts[5]),
            priceUSD: parseFloat(parts[6]),
            timestamp: parseInt(parts[7]),
            signature
        };
    } catch {
        return null;
    }
}

/**
 * Query all position memos for a wallet from the blockchain
 */
export async function queryPositionMemos(
    connection: Connection,
    wallet: string,
    vault?: 'growth' | 'degen',
    limit: number = 100
): Promise<PositionMemo[]> {
    try {
        log('Querying position memos from blockchain');

        const walletPubkey = new PublicKey(wallet);

        // Get recent transaction signatures for this wallet
        const signatures = await connection.getSignaturesForAddress(
            walletPubkey,
            { limit }
        );

        if (signatures.length === 0) {
            log('No transactions found');
            return [];
        }

        log(`Found ${signatures.length} transactions, parsing memos...`);

        const memos: PositionMemo[] = [];

        // Fetch transactions in batches
        const batchSize = 20;
        for (let i = 0; i < signatures.length; i += batchSize) {
            const batch = signatures.slice(i, i + batchSize);
            const txs = await connection.getParsedTransactions(
                batch.map(s => s.signature),
                { maxSupportedTransactionVersion: 0 }
            );

            for (let j = 0; j < txs.length; j++) {
                const tx = txs[j];
                if (!tx?.meta?.logMessages) continue;

                // Look for memo program logs
                for (const logMsg of tx.meta.logMessages) {
                    if (logMsg.includes('Program log: Memo') || logMsg.includes(MEMO_PREFIX)) {
                        // Extract memo content
                        const memoMatch = logMsg.match(/Memo \(len \d+\): "(.+)"/);
                        if (memoMatch) {
                            const parsed = parseMemoString(memoMatch[1], batch[j].signature);
                            if (parsed && (!vault || parsed.vault === vault)) {
                                memos.push(parsed);
                            }
                        }
                        // Also check for raw memo content
                        if (logMsg.includes(MEMO_PREFIX)) {
                            const parsed = parseMemoString(logMsg, batch[j].signature);
                            if (parsed && (!vault || parsed.vault === vault)) {
                                memos.push(parsed);
                            }
                        }
                    }
                }
            }
        }

        log(`Found ${memos.length} position memos`);
        return memos.sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
        logger.error('Failed to query position memos', 'PositionMemo');
        return [];
    }
}

/**
 * Reconstruct current positions from memo history
 * 
 * This is the magic - we replay all open/close/add/reduce actions
 * to calculate the current state of positions.
 */
export async function reconstructPositions(
    connection: Connection,
    wallet: string,
    vault: 'growth' | 'degen'
): Promise<ReconstructedPosition[]> {
    log(`Reconstructing ${vault} positions from on-chain memos`);

    const memos = await queryPositionMemos(connection, wallet, vault);

    // Track positions by token
    const positionMap = new Map<string, {
        amount: number;
        totalCost: number;
        symbol: string;
        openedAt: number;
    }>();

    for (const memo of memos) {
        const key = memo.tokenMint;
        const existing = positionMap.get(key) || {
            amount: 0,
            totalCost: 0,
            symbol: memo.tokenSymbol,
            openedAt: memo.timestamp
        };

        switch (memo.action) {
            case 'open':
            case 'add':
                // Add to position
                existing.amount += memo.amount;
                existing.totalCost += memo.amount * memo.priceUSD;
                if (!positionMap.has(key)) {
                    existing.openedAt = memo.timestamp;
                }
                break;

            case 'close':
                // Close entire position
                existing.amount = 0;
                existing.totalCost = 0;
                break;

            case 'reduce':
                // Reduce position proportionally
                if (existing.amount > 0) {
                    const reducePercent = memo.amount / existing.amount;
                    existing.amount -= memo.amount;
                    existing.totalCost -= existing.totalCost * reducePercent;
                }
                break;
        }

        positionMap.set(key, existing);
    }

    // Convert to array, filter out closed positions
    const positions: ReconstructedPosition[] = [];
    for (const [mint, data] of positionMap) {
        if (data.amount > 0.000001) {
            positions.push({
                tokenMint: mint,
                tokenSymbol: data.symbol,
                amount: data.amount,
                entryPrice: data.totalCost / data.amount,
                totalCost: data.totalCost,
                openedAt: data.openedAt
            });
        }
    }

    log(`Reconstructed ${positions.length} active positions`);
    return positions;
}

/**
 * Check if wallet has any ShadowFund position history
 */
export async function hasPositionHistory(
    connection: Connection,
    wallet: string
): Promise<boolean> {
    const memos = await queryPositionMemos(connection, wallet, undefined, 10);
    return memos.length > 0;
}

/**
 * Get position summary for a vault
 */
export async function getPositionSummary(
    connection: Connection,
    wallet: string,
    vault: 'growth' | 'degen'
): Promise<{
    totalPositions: number;
    totalInvested: number;
    tokens: string[];
}> {
    const positions = await reconstructPositions(connection, wallet, vault);

    return {
        totalPositions: positions.length,
        totalInvested: positions.reduce((sum, p) => sum + p.totalCost, 0),
        tokens: positions.map(p => p.tokenSymbol)
    };
}
