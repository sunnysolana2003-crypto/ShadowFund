import { ShadowWireClient, TokenUtils } from "@radr/shadowwire";
import { PublicKey } from "@solana/web3.js";
import { connection } from "./rpc";
import { config } from "./config";
import { MockShadowWireClient, MockTokenUtils } from "./shadowwire-mock";
import { TOKENS } from "./protocols/types";

const USD1_MINT = TOKENS.USD1;

function isDevnet(): boolean {
    return (
        (process.env.SOLANA_RPC_URL || "").includes("devnet") ||
        (process.env.SHADOWWIRE_CLUSTER || "").includes("devnet")
    );
}

function shadowwireNetwork(): "devnet" | "mainnet" {
    return isDevnet() ? "devnet" : "mainnet";
}

function isMockMode(): boolean {
    return config.shadowwireMock === true;
}

// Initialize the ShadowWire client
export const shadowwire: any = isMockMode()
    ? new MockShadowWireClient({ network: shadowwireNetwork(), debug: process.env.NODE_ENV === "development" })
    : new ShadowWireClient({
        // @ts-ignore - SDK network enum is not typed for all values
        network: shadowwireNetwork(),
        debug: process.env.NODE_ENV === "development",
    });

// Helper to get USD1 balance for a wallet
export async function getPrivateBalance(wallet: string): Promise<number> {
    try {
        const balanceResponse = await shadowwire.getBalance(wallet, "USDC");
        // SDK returns an object with 'available' (current withdrawable) and 'deposited' (lifetime total)
        const rawBalance = typeof balanceResponse === 'object' ? (balanceResponse as any).available || 0 : balanceResponse;

        // Force manual conversion: atomic / 1e6
        return Number(rawBalance) / 1_000_000;
    } catch (error) {
        console.error("Error fetching private balance:", error);
        return 0;
    }
}

// Helper to get PUBLIC SPL token balance for USD1
export async function getPublicBalance(wallet: string): Promise<number> {
    try {
        const pubkey = new PublicKey(wallet);
        const mint = new PublicKey(USD1_MINT);

        const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
            mint: mint
        });

        if (accounts.value.length === 0) return 0;

        const amount = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return typeof amount === "number" ? amount : 0;
    } catch (error) {
        console.error("Error fetching public balance:", error);
        return 0;
    }
}

// Helper to convert USD1 amounts
export const USD1Utils = {
    toSmallestUnit: (amount: number) => Math.floor(amount * 1_000_000),
    fromSmallestUnit: (amount: number) => amount / 1_000_000,
    getFee: () => 0.01,
    getMinimum: () => 0.01,
    calculateFee: (amount: number) => {
        const fee = amount * 0.01;
        return { fee, netAmount: amount - fee };
    }
};

// Interface for transfer parameters
export interface PrivateTransferParams {
    sender: string;
    recipient: string;
    amount: number;
    wallet?: {
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };
}

// Execute a private internal transfer (amount hidden with ZK proofs)
export async function privateTransfer(params: PrivateTransferParams) {
    const { sender, recipient, amount, wallet } = params;

    console.log(`[ShadowWire] Executing REAL ZK-Transfer: ${amount} USDC from ${sender.slice(0, 8)}`);

    return await shadowwire.transfer({
        sender,
        recipient,
        amount,
        token: "USDC",
        type: "internal", // Hidden amount using ZK proofs
        wallet
    });
}

// Execute an external transfer (visible amount, anonymous sender)
export async function externalTransfer(params: PrivateTransferParams) {
    const { sender, recipient, amount, wallet } = params;

    return await shadowwire.transfer({
        sender,
        recipient,
        amount,
        token: "USDC",
        type: "external",
        wallet
    });
}

// Deposit USD1 into ShadowWire
export async function deposit(wallet: string, amount: number) {
    console.log(`[ShadowWire] Starting REAL deposit: wallet=${wallet}, amount=${amount} (Using Hybrid ID: USDC + Mint)`);

    try {
        // use standard 6 decimals for USDC
        const smallestUnit = Math.floor(amount * 1_000_000);
        console.log(`[ShadowWire] Amount (atomic): ${smallestUnit}`);

        const response = await shadowwire.deposit({
            wallet,
            // Hybrid Approach:
            // 1. token: "USDC" -> Tells Relayer to use Trusted Asset rules (Low Minimum)
            // 2. token_mint: USD1_MINT -> Tells SDK/Relayer specifically WHICH USDC to use
            // @ts-ignore
            token: "USDC",
            token_mint: USD1_MINT,
            amount: smallestUnit
        });

        console.log(`[ShadowWire] Deposit response:`, response);
        return response;
    } catch (error) {
        console.error(`[ShadowWire] Deposit FAILED:`, error);
        throw error;
    }
}

// Withdraw USD1 from ShadowWire
export async function withdraw(wallet: string, amount: number) {
    console.log(`[ShadowWire] Starting REAL withdraw: wallet=${wallet}, amount=${amount}`);

    // standard 6 decimals
    const smallestUnit = Math.floor(amount * 1_000_000);
    return await shadowwire.withdraw({
        wallet,
        // @ts-ignore
        token: "USDC",
        token_mint: USD1_MINT,
        amount: smallestUnit
    });
}

// Export the client and utils
export const TokenUtilsImpl = isMockMode() ? MockTokenUtils : TokenUtils;
export { ShadowWireClient };
export { TokenUtilsImpl as TokenUtils };
