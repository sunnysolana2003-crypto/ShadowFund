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
import { getRuntimeMode } from "./runtimeMode.js";

const DECIMALS = 6; // USD1 has 6 decimals
const DEFAULT_REAL_INTERNAL_MIN = 5; // ShadowWire anti-spam: 5 USDC min per internal transfer

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
        if (from === to) {
            return {
                success: true,
                txHash: "noop_self_transfer"
            };
        }

        // ShadowWire internal transfers have an anti-spam minimum on mainnet.
        // Treat USD1 as 1:1 with USDC for minimum enforcement.
        const runtimeMode = getRuntimeMode();
        const envMin = Number(process.env.SHADOWWIRE_MIN_INTERNAL_TRANSFER_USD1);
        const realMin =
            Number.isFinite(envMin) && envMin > 0 ? envMin : DEFAULT_REAL_INTERNAL_MIN;
        let minimum = runtimeMode === "real" ? realMin : USD1Utils.getMinimum();

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

        // Execute private transfer with ZK proofs
        const result = await privateTransfer({
            sender: from,
            recipient: to,
            amount,
            wallet
        });

        const ok = (result as any)?.success !== false;
        const txHash =
            (result as any)?.tx_signature ||
            (result as any)?.txSignature ||
            (result as any)?.tx_signature_base58 ||
            undefined;

        if (!ok) {
            return {
                success: false,
                error: (result as any)?.error || "ShadowWire transfer failed"
            };
        }

        return {
            success: true,
            txHash: txHash || "pending"
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
