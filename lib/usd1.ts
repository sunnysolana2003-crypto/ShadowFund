/**
 * USD1 Token Operations
 * Handles balance fetching and private transfers using ShadowWire.
 * Non-logging policy: no addresses or amounts in logs.
 */
import {
    shadowwire,
    getPrivateBalance,
    privateTransfer,
    USD1Utils,
    TokenUtils
} from "./shadowwire.js";
import { logger } from "./logger.js";

const DECIMALS = 6; // USD1 has 6 decimals

/**
 * Get USD1 balance for a vault address
 */
export async function getUSD1Balance(addr: string): Promise<number> {
    try {
        // Use the ShadowWire client to get private balance
        const balance = await getPrivateBalance(addr);
        return balance;
    } catch {
        logger.error("Error fetching USD1 balance", "USD1");
        return 0;
    }
}

/**
 * Get public USD1 balance for a wallet address
 */
export async function getPublicUSD1Balance(addr: string): Promise<number> {
    try {
        const { getPublicBalance } = await import("./shadowwire.js");
        return await getPublicBalance(addr);
    } catch {
        logger.error("Error fetching public USD1 balance", "USD1");
        return 0;
    }
}

/**
 * Move USD1 between vaults using private ZK transfer
 */
export async function moveUSD1(
    from: string,
    to: string,
    amount: number,
    wallet?: { signMessage: (message: Uint8Array) => Promise<Uint8Array> }
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        // Use the minimum amount check
        let minimum = USD1Utils.getMinimum();

        // OVERRIDE: On Devnet OR Testing Mode, allow small transfers
        if (process.env.SOLANA_RPC_URL?.includes('devnet') || process.env.TESTING_MODE === 'true') {
            minimum = 0.01;
        }

        if (amount < minimum) {
            return {
                success: false,
                error: `Amount ${amount.toFixed(4)} is below minimum ${minimum} USD1`
            };
        }

        const feeBreakdown = USD1Utils.calculateFee(amount);

        // Execute private transfer with ZK proofs
        const result = await privateTransfer({
            sender: from,
            recipient: to,
            amount,
            wallet
        });

        return {
            success: true,
            txHash: (result as any)?.tx_signature || "pending"
        };
    } catch (err) {
        logger.error("Error moving USD1", "USD1");
        return {
            success: false,
            error: err instanceof Error ? err.message : "Transfer failed"
        };
    }
}

/**
 * Get USD1 fee information
 */
export function getUSD1Fees() {
    return {
        feePercentage: USD1Utils.getFee(),
        minimumAmount: USD1Utils.getMinimum(),
        decimals: DECIMALS
    };
}

/**
 * Convert display amount to smallest unit
 */
export function toSmallestUnit(amount: number): number {
    return TokenUtils.toSmallestUnit(amount, "USD1");
}

/**
 * Convert smallest unit to display amount
 */
export function fromSmallestUnit(amount: number): number {
    return TokenUtils.fromSmallestUnit(amount, "USD1");
}
