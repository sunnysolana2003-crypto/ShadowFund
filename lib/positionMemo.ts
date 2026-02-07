/**
 * Position Memo System
 * 
 * Stores position data on-chain using Solana's Memo Program.
 * Positions are fully decentralized and permanent - no database needed.
 * 
 * Memo format: SHADOWFUND|{vault}|{action}|{token}|{amount}|{price}|{timestamp}
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { logger } from './logger.js';

const MEMO_PREFIX = 'SHADOWFUND';
const log = (msg: string) => logger.info(msg, 'PositionMemo');

// In-memory memo cache (serverless instance lifetime).
// This avoids re-scanning the same wallet multiple times per request (yield + growth + degen),
// which can easily trip public RPC rate limits (429).
const MEMO_CACHE_TTL_MS = Number(process.env.POSITION_MEMO_CACHE_TTL_MS) || 120_000;
type MemoCacheEntry =
    | { fetchedAt: number; memos: PositionMemo[] }
    | { fetchedAt: number; inflight: Promise<PositionMemo[]> };
const memoCache: Map<string, MemoCacheEntry> = new Map();

// Position data stored in memo
export interface PositionMemo {
    vault: 'growth' | 'degen' | 'yield';
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
    data: Omit<PositionMemo, 'signature'>,
    requireSigner: boolean = true
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

    return new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [
            {
                pubkey: wallet,
                isSigner: requireSigner,
                isWritable: false
            }
        ],
        data: Buffer.from(memoString, 'utf8')
    });
}

/**
 * Add position memo to an existing transaction
 */
export function addPositionMemoToTransaction(
    transaction: Transaction,
    wallet: PublicKey,
    data: Omit<PositionMemo, 'signature'>,
    requireSigner: boolean = true
): Transaction {
    const memoIx = createPositionMemoInstruction(wallet, data, requireSigner);
    transaction.add(memoIx);
    return transaction;
}

/**
 * Build a standalone memo transaction (useful for user-signed memo-only txs)
 */
export async function buildPositionMemoTransaction(
    connection: Connection,
    wallet: PublicKey,
    memos: Array<Omit<PositionMemo, 'signature'>>,
    requireSigner: boolean = true
): Promise<Transaction> {
    const transaction = new Transaction();

    for (const memo of memos) {
        transaction.add(createPositionMemoInstruction(wallet, memo, requireSigner));
    }

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet;

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
            vault: parts[1] as 'growth' | 'degen' | 'yield',
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

async function rpcWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 5,
    delayMs: number = 500
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isRateLimit =
            message.includes("429") ||
            message.toLowerCase().includes("too many requests") ||
            message.toLowerCase().includes("rate limit");

        if (!isRateLimit || retries <= 0) {
            throw error;
        }

        // Exponential backoff with small jitter
        const jitter = Math.floor(Math.random() * 150);
        const sleep = delayMs + jitter;
        await new Promise((r) => setTimeout(r, sleep));
        return rpcWithBackoff(fn, retries - 1, Math.min(delayMs * 2, 8_000));
    }
}

async function fetchAllPositionMemos(
    connection: Connection,
    wallet: string,
    limit: number
): Promise<PositionMemo[]> {
    const cacheKey = `${wallet}:${limit}`;
    const cached = memoCache.get(cacheKey);
    const now = Date.now();
    if (cached) {
        if ("memos" in cached && now - cached.fetchedAt < MEMO_CACHE_TTL_MS) {
            return cached.memos;
        }
        if ("inflight" in cached) {
            return cached.inflight;
        }
    }

    const previousMemos = cached && "memos" in cached ? cached.memos : undefined;

    // De-dupe concurrent scans for the same wallet/limit within a warm serverless instance.
    // Without this, getVaultStats() triggers three parallel scans (yield + growth + degen),
    // which often trips public RPC 429 limits.
    const inflight = (async () => {
        const walletPubkey = new PublicKey(wallet);

        // Get recent transaction signatures for this wallet
        const signatures = await rpcWithBackoff(() =>
            connection.getSignaturesForAddress(walletPubkey, { limit })
        );

        if (signatures.length === 0) {
            return [];
        }

        const memos: PositionMemo[] = [];

        // Fetch transactions in batches
        const batchSize = 20;
        for (let i = 0; i < signatures.length; i += batchSize) {
            const batch = signatures.slice(i, i + batchSize);
            const txs = await rpcWithBackoff(() =>
                connection.getParsedTransactions(
                    batch.map((s) => s.signature),
                    { maxSupportedTransactionVersion: 0 }
                )
            );

            for (let j = 0; j < txs.length; j++) {
                const tx = txs[j];
                if (!tx?.meta?.logMessages) continue;

                for (const logMsg of tx.meta.logMessages) {
                    if (logMsg.includes('Program log: Memo') || logMsg.includes(MEMO_PREFIX)) {
                        const memoMatch = logMsg.match(/Memo \(len \d+\): "(.+)"/);
                        if (memoMatch) {
                            const parsed = parseMemoString(memoMatch[1], batch[j].signature);
                            if (parsed) memos.push(parsed);
                        }
                        if (logMsg.includes(MEMO_PREFIX)) {
                            const parsed = parseMemoString(logMsg, batch[j].signature);
                            if (parsed) memos.push(parsed);
                        }
                    }
                }
            }
        }

        return memos.sort((a, b) => a.timestamp - b.timestamp);
    })();

    memoCache.set(cacheKey, { fetchedAt: now, inflight });

    try {
        const memos = await inflight;
        memoCache.set(cacheKey, { fetchedAt: Date.now(), memos });
        return memos;
    } catch (error) {
        // If we're rate-limited, fall back to the last cached memos (stale but useful)
        // instead of zeroing out the user's positions.
        if (previousMemos) {
            logger.warn("RPC limited while scanning memos; using cached results", "PositionMemo");
            memoCache.set(cacheKey, { fetchedAt: Date.now(), memos: previousMemos });
            return previousMemos;
        }

        memoCache.delete(cacheKey);
        throw error;
    }
}

/**
 * Query all position memos for a wallet from the blockchain
 */
export async function queryPositionMemos(
    connection: Connection,
    wallet: string,
    vault?: 'growth' | 'degen' | 'yield',
    limit: number = 100
): Promise<PositionMemo[]> {
    try {
        log('Querying position memos from blockchain');
        const memos = await fetchAllPositionMemos(connection, wallet, limit);
        const filtered = vault ? memos.filter((m) => m.vault === vault) : memos;
        log(`Found ${filtered.length} position memos`);
        return filtered;

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
    vault: 'growth' | 'degen' | 'yield'
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
