import nacl from "tweetnacl";
import bs58 from "bs58";

export function verifySignature(
    message: string,
    signature: string,
    publicKey: string
): boolean {
    try {
        const msg = new TextEncoder().encode(message);
        const sig = bs58.decode(signature);
        const pub = bs58.decode(publicKey);

        return nacl.sign.detached.verify(msg, sig, pub);
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}
