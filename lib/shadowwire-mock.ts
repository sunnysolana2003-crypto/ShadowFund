/**
 * ShadowWire Mock Implementation
 * Simulates ShadowWire SDK for devnet when relayer doesn't support token mints.
 * Enable with: SHADOWWIRE_MOCK=true in .env.local
 * Non-logging policy: no wallets, amounts, or balances in logs.
 */

import { logger } from "./logger.js";

// In-memory balance storage (persists for server lifetime)
// Maps wallet address -> private balance in smallest units (6 decimals)
const privateBalances: Map<string, number> = new Map();

// Transaction history for debugging
interface MockTransaction {
    id: string;
    type: 'deposit' | 'withdraw' | 'transfer';
    from: string;
    to?: string;
    amount: number;
    timestamp: number;
    status: 'success' | 'failed';
}
const transactionHistory: MockTransaction[] = [];

// Generate mock transaction ID
function generateTxId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Simulate network delay
async function simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 300));
}

/**
 * Mock ShadowWire Client
 */
export class MockShadowWireClient {
    private network: string;
    private debug: boolean;

    constructor(options: { network?: string; debug?: boolean } = {}) {
        this.network = options.network || 'devnet';
        this.debug = options.debug || false;
        logger.info("Mock client initialized", "ShadowWire-Mock", { network: this.network });
    }

    async getBalance(wallet: string, token: string): Promise<{ available: number; deposited: number }> {
        await simulateDelay(100);
        const balance = privateBalances.get(wallet) || 0;
        
        if (this.debug) {
            logger.debug("getBalance", "ShadowWire-Mock");
        }

        return {
            available: balance,
            deposited: balance // Lifetime total (simplified for mock)
        };
    }

    async deposit(params: { wallet: string; amount: number; token?: string; token_mint?: string }): Promise<{
        success: boolean;
        txSignature: string;
        amount: number;
        fee: number;
    }> {
        const { wallet, amount } = params;
        
        logger.info("Deposit", "ShadowWire-Mock");
        await simulateDelay(800);

        // Calculate 1% fee
        const fee = Math.floor(amount * 0.01);
        const netAmount = amount - fee;

        // Credit the private balance
        const currentBalance = privateBalances.get(wallet) || 0;
        privateBalances.set(wallet, currentBalance + netAmount);

        const txId = generateTxId();
        
        // Record transaction
        transactionHistory.push({
            id: txId,
            type: 'deposit',
            from: wallet,
            amount: netAmount,
            timestamp: Date.now(),
            status: 'success'
        });

        logger.info("Deposit success", "ShadowWire-Mock");

        return {
            success: true,
            txSignature: txId,
            amount: netAmount,
            fee: fee
        };
    }

    async withdraw(params: { wallet: string; amount: number; token?: string; token_mint?: string }): Promise<{
        success: boolean;
        txSignature: string;
        amount: number;
        fee: number;
    }> {
        const { wallet, amount } = params;
        
        logger.info("Withdraw", "ShadowWire-Mock");
        await simulateDelay(800);

        const currentBalance = privateBalances.get(wallet) || 0;

        // Check sufficient balance
        if (currentBalance < amount) {
            logger.warn("Insufficient balance", "ShadowWire-Mock");
            throw new Error(`Insufficient private balance`);
        }

        // Calculate 1% fee
        const fee = Math.floor(amount * 0.01);
        const netAmount = amount - fee;

        // Debit the private balance
        privateBalances.set(wallet, currentBalance - amount);

        const txId = generateTxId();

        // Record transaction
        transactionHistory.push({
            id: txId,
            type: 'withdraw',
            from: wallet,
            amount: netAmount,
            timestamp: Date.now(),
            status: 'success'
        });

        logger.info("Withdraw success", "ShadowWire-Mock");

        return {
            success: true,
            txSignature: txId,
            amount: netAmount,
            fee: fee
        };
    }

    async transfer(params: {
        sender: string;
        recipient: string;
        amount: number;
        token: string;
        type: 'internal' | 'external';
        wallet?: any;
    }): Promise<{
        success: boolean;
        txSignature: string;
        amount: number;
    }> {
        const { sender, recipient, amount, type } = params;
        
        logger.info(type === 'internal' ? "Private transfer" : "External transfer", "ShadowWire-Mock");
        await simulateDelay(600);

        const senderBalance = privateBalances.get(sender) || 0;
        const amountSmallest = Math.floor(amount * 1_000_000);

        // Check sufficient balance
        if (senderBalance < amountSmallest) {
            logger.warn("Insufficient balance for transfer", "ShadowWire-Mock");
            throw new Error(`Insufficient balance for transfer`);
        }

        // Debit sender
        privateBalances.set(sender, senderBalance - amountSmallest);

        // Credit recipient (for internal transfers)
        if (type === 'internal') {
            const recipientBalance = privateBalances.get(recipient) || 0;
            privateBalances.set(recipient, recipientBalance + amountSmallest);
        }

        const txId = generateTxId();

        // Record transaction
        transactionHistory.push({
            id: txId,
            type: 'transfer',
            from: sender,
            to: recipient,
            amount: amountSmallest,
            timestamp: Date.now(),
            status: 'success'
        });

        logger.info("Transfer success", "ShadowWire-Mock");

        return {
            success: true,
            txSignature: txId,
            amount: amountSmallest
        };
    }

    // Fee helpers
    getFeePercentage(token: string): number {
        return 1; // 1%
    }

    getMinimumAmount(token: string): number {
        return 0.01;
    }

    calculateFee(amount: number, token: string): { fee: number; netAmount: number } {
        const fee = amount * 0.01;
        return { fee, netAmount: amount - fee };
    }
}

/**
 * Mock TokenUtils
 */
export const MockTokenUtils = {
    toSmallestUnit: (amount: number, token: string): number => {
        // USD1/USDC = 6 decimals
        return Math.floor(amount * 1_000_000);
    },
    fromSmallestUnit: (amount: number, token: string): number => {
        return amount / 1_000_000;
    }
};

/**
 * Debug helpers
 */
export function getMockBalances(): Map<string, number> {
    return new Map(privateBalances);
}

export function getMockTransactions(): MockTransaction[] {
    return [...transactionHistory];
}

export function setMockBalance(wallet: string, amount: number): void {
    privateBalances.set(wallet, Math.floor(amount * 1_000_000));
    logger.debug("Set mock balance", "ShadowWire-Mock");
}

export function clearMockData(): void {
    privateBalances.clear();
    transactionHistory.length = 0;
    logger.info("Cleared mock data", "ShadowWire-Mock");
}

export function seedTestBalances(): void {
    logger.debug("Seeding test balances", "ShadowWire-Mock");
}
