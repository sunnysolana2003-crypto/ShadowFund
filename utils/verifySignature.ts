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
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = new PublicKey(publicKey).toBytes();

        return nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );
    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
}
