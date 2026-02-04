import { ShadowWireClient, TokenUtils } from "@radr/shadowwire";
import { PublicKey } from "@solana/web3.js";
import { connection } from "./rpc";
import { config } from "./config";
import { MockShadowWireClient, MockTokenUtils } from "./shadowwire-mock";
import { TOKENS } from "./protocols/types";
import { logger } from "./logger";

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
    } catch {
        logger.error("Error fetching private balance", "ShadowWire");
        return 0;
    }
}

// Helper to get PUBLIC SPL token balance for USD1
export async function getPublicBalance(wallet: string): Promise<number> {
    try {
        logger.info(`Fetching USD1 balance for wallet`, "ShadowWire");
        const pubkey = new PublicKey(wallet);
        const mint = new PublicKey(USD1_MINT);

        logger.info(`USD1 Mint: ${USD1_MINT}`, "ShadowWire");
        logger.info(`Network: ${isDevnet() ? "devnet" : "mainnet"}`, "ShadowWire");

        const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
            mint: mint
        });

        logger.info(`Found ${accounts.value.length} USD1 token accounts`, "ShadowWire");

        if (accounts.value.length === 0) {
            logger.warn("No USD1 token account found for wallet", "ShadowWire");
            return 0;
        }

        const amount = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        const balance = typeof amount === "number" ? amount : 0;

        logger.info(`USD1 balance retrieved: ${balance}`, "ShadowWire");
        return balance;
    } catch (error) {
        logger.error("Error fetching public balance", "ShadowWire", {
            error: error instanceof Error ? error.message : String(error),
            mint: USD1_MINT,
            wallet: `${wallet.slice(0, 8)}...${wallet.slice(-8)}`
        });
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

    logger.info("ZK-Transfer executing", "ShadowWire");

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
    logger.info("Deposit started", "ShadowWire");

    try {
        const smallestUnit = Math.floor(amount * 1_000_000);

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

        return response;
    } catch (error) {
        logger.error("Deposit failed", "ShadowWire");
        throw error;
    }
}

// Withdraw USD1 from ShadowWire
export async function withdraw(wallet: string, amount: number) {
    logger.info("Withdraw started", "ShadowWire");

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
