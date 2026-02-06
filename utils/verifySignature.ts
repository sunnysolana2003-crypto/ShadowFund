/**
 * Signature Verification Utility
 * Verifies wallet signatures for secure API operations
 */
import { PublicKey } from "@solana/web3.js";
import * as nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Verify a signature from a Solana wallet
 * @param message - The message that was signed
 * @param signature - The signature (base58 encoded)
 * @param publicKey - The public key of the signer (base58 encoded)
 * @returns true if signature is valid
 */
export function verifySignature(
    message: string,
    signature: string,
    publicKey: string
): boolean {
    try {
        if (!signature || !publicKey) return false;

        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = new PublicKey(publicKey).toBytes();

        const naclLib: any = (nacl as any).sign ? nacl : (nacl as any).default || nacl;
        if (!naclLib?.sign?.detached?.verify) {
            console.error("Signature verification failed: tweetnacl sign.verify unavailable");
            return false;
        }

        return naclLib.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );
    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
}
