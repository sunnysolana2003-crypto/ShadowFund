/**
 * USD1 Token Operations
 * Handles balance fetching and private transfers using ShadowWire
 */

import {
    shadowwire,
    getPrivateBalance,
    privateTransfer,
    USD1Utils,
    TokenUtils
} from "./shadowwire";

const DECIMALS = 6; // USD1 has 6 decimals

/**
 * Get USD1 balance for a vault address
 */
export async function getUSD1Balance(addr: string): Promise<number> {
    try {
        // Use the ShadowWire client to get private balance
        const balance = await getPrivateBalance(addr);
        return balance;
    } catch (error) {
        console.error(`Error fetching USD1 balance for ${addr}:`, error);
        return 0;
    }
}

/**
 * Get public USD1 balance for a wallet address
 */
export async function getPublicUSD1Balance(addr: string): Promise<number> {
    try {
        const { getPublicBalance } = await import("./shadowwire");
        return await getPublicBalance(addr);
    } catch (error) {
        console.error(`Error fetching public USD1 balance for ${addr}:`, error);
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
            console.log('[USD1] Testing mode: Using reduced minimum of 0.01 USD1');
        }

        if (amount < minimum) {
            return {
                success: false,
                error: `Amount ${amount.toFixed(4)} is below minimum ${minimum} USD1`
            };
        }

        // Calculate fee for logging
        const feeBreakdown = USD1Utils.calculateFee(amount);
        console.log(`[ShadowWire] Moving ${amount} USD1: fee=${feeBreakdown.fee}, net=${feeBreakdown.netAmount}`);

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
    } catch (error) {
        console.error(`Error moving USD1 from ${from} to ${to}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Transfer failed"
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
