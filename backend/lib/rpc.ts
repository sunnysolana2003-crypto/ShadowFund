import { Connection } from "@solana/web3.js";

export const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed"
);

export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        if (retries <= 0) throw e;
        await new Promise(r => setTimeout(r, 500));
        return withRetry(fn, retries - 1);
    }
}
