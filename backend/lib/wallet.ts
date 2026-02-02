/**
 * Wallet Management for Server-Side Operations
 * Handles wallet creation, loading, and validation
 * 
 * SECURITY WARNING: Handle private keys with extreme care!
 * In production, use AWS KMS, HashiCorp Vault, or similar secure key management
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Get server wallet from environment variable
 * This wallet executes on-chain transactions on behalf of the system
 */
export function getServerWallet(): Keypair {
    const secretKey = process.env.SERVER_WALLET_SECRET;

    if (!secretKey) {
        console.warn('⚠️  SERVER_WALLET_SECRET not set - using demo mode');
        // In demo mode, generate a temporary wallet
        return Keypair.generate();
    }

    try {
        // Try base64 encoding first
        const decodedKey = Buffer.from(secretKey, 'base64');
        if (decodedKey.length === 64) {
            return Keypair.fromSecretKey(decodedKey);
        }

        // Try bs58 encoding
        const bs58DecodedKey = bs58.decode(secretKey);
        if (bs58DecodedKey.length === 64) {
            return Keypair.fromSecretKey(bs58DecodedKey);
        }

        throw new Error('Invalid key format');
    } catch (error) {
        console.error('Failed to load server wallet:', error);
        console.warn('⚠️  Falling back to demo wallet');
        return Keypair.generate();
    }
}

/**
 * Validate a wallet address
 */
export function isValidPublicKey(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate a new wallet (for testing)
 * Returns public key and base64-encoded secret
 */
export function generateWallet(): {
    publicKey: string;
    secretKeyBase64: string;
    secretKeyBs58: string;
} {
    const keypair = Keypair.generate();

    return {
        publicKey: keypair.publicKey.toBase58(),
        secretKeyBase64: Buffer.from(keypair.secretKey).toString('base64'),
        secretKeyBs58: bs58.encode(keypair.secretKey)
    };
}

/**
 * Get wallet from user's public key
 */
export function getUserWallet(userPublicKey: string): PublicKey {
    if (!isValidPublicKey(userPublicKey)) {
        throw new Error('Invalid user wallet address');
    }

    return new PublicKey(userPublicKey);
}

/**
 * Get wallet info for logging (safe to display)
 */
export function getWalletInfo(): { publicKey: string; isConfigured: boolean } {
    try {
        const wallet = getServerWallet();
        return {
            publicKey: wallet.publicKey.toBase58(),
            isConfigured: !!process.env.SERVER_WALLET_SECRET
        };
    } catch {
        return {
            publicKey: 'Not configured',
            isConfigured: false
        };
    }
}
