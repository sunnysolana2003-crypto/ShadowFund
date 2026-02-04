/**
 * Vault Management
 * Handles deterministic vault address derivation using ShadowWire.
 * Non-logging policy: no wallet or address in logs.
 */
import { VaultId } from "../types";
import { logger } from "./logger";
import { PublicKey } from "@solana/web3.js";
import crypto from "crypto";
import bs58 from "bs58";

// Cache for vault addresses (same wallet + id = same address forever)
const vaultCache = new Map<string, string>();

// Program ID used for deterministic address derivation (ShadowFund Program)
const SHADOW_FUND_PROGRAM_ID = new PublicKey("SHADpwBvXUq6xYnYH5XvR7sXpYqYxXfXmXnXeXfXmXn");

/**
 * Get or derive a deterministic vault address for a wallet and vault type
 * The same wallet + vault ID combination always returns the same address
 */
export async function getVaultAddress(wallet: string, id: VaultId): Promise<string> {
    const cacheKey = `${wallet}:${id}`;

    // Check cache first
    if (vaultCache.has(cacheKey)) {
        return vaultCache.get(cacheKey)!;
    }

    try {
        // Validation: Verify wallet is a valid public key
        let userPubKey: PublicKey;
        try {
            userPubKey = new PublicKey(wallet);
        } catch (e) {
            logger.error("Invalid wallet address", "Vaults");
            throw new Error(`Invalid user wallet address: ${wallet}`);
        }

        // Generate a deterministic PDA for this vault
        // Using [user_pubkey, vault_id] as seeds
        const [pda] = PublicKey.findProgramAddressSync(
            [
                userPubKey.toBuffer(),
                Buffer.from(id)
            ],
            SHADOW_FUND_PROGRAM_ID
        );

        const address = pda.toBase58();

        // Cache the result
        vaultCache.set(cacheKey, address);

        return address;
    } catch (error) {
        logger.error("Error deriving vault address", "Vaults");
        // Fallback to a legacy derivation if web3.js fails (though it shouldn't)
        const seed = `shadowfund:${wallet}:${id}`;
        const hash = crypto.createHash("sha256").update(seed).digest();
        const address = bs58.encode(hash);
        return address;
    }
}

/**
 * Get all vault addresses for a wallet
 */
export async function getAllVaultAddresses(wallet: string): Promise<Record<VaultId, string>> {
    const vaultIds: VaultId[] = ["reserve", "yield", "growth", "degen"];
    const addresses: Record<string, string> = {};

    for (const id of vaultIds) {
        addresses[id] = await getVaultAddress(wallet, id);
    }

    return addresses as Record<VaultId, string>;
}

/**
 * Validate a vault address format
 */
export function isValidVaultAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

