import { PublicKey } from "@solana/web3.js";
import { createRequire } from "node:module";
import { connection } from "./rpc.js";
import { config } from "./config.js";
import { MockShadowWireClient, MockTokenUtils } from "./shadowwire-mock.js";
import { TOKENS } from "./protocols/types.js";
import { logger } from "./logger.js";
import { getRuntimeMode } from "./runtimeMode.js";

const USD1_MINT = TOKENS.USD1;
const SHADOWWIRE_API_BASE = process.env.SHADOWWIRE_API_URL || "https://shadow.radr.fun/shadowpay/api";

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
    const runtimeMode = getRuntimeMode();
    if (runtimeMode === "real") return false;
    if (runtimeMode === "demo") return true;
    return config.shadowwireMock === true;
}

type ShadowwireSdk = {
    ShadowWireClient: new (options: { network: "devnet" | "mainnet"; debug?: boolean }) => any;
    TokenUtils: {
        toSmallestUnit: (amount: number, token: string) => number;
        fromSmallestUnit: (amount: number, token: string) => number;
    };
};

let mockClient: MockShadowWireClient | null = null;
let sdkPromise: Promise<ShadowwireSdk | null> | null = null;
let clientPromise: Promise<any> | null = null;
let tokenUtilsImpl = MockTokenUtils;

const nodeRequire = createRequire(import.meta.url);

async function fetchShadowwireBalance(wallet: string, tokenMint: string): Promise<any | null> {
    try {
        const url = `${SHADOWWIRE_API_BASE}/pool/balance/${wallet}?token_mint=${tokenMint}`;
        const headers: Record<string, string> = {};
        if (process.env.SHADOWWIRE_API_KEY) {
            headers["x-api-key"] = process.env.SHADOWWIRE_API_KEY;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch {
        return null;
    }
}

function getMockClient(): MockShadowWireClient {
    if (!mockClient) {
        mockClient = new MockShadowWireClient({
            network: shadowwireNetwork(),
            debug: process.env.NODE_ENV === "development"
        });
    }
    return mockClient;
}

async function loadShadowwireSdk(): Promise<ShadowwireSdk | null> {
    if (sdkPromise) return sdkPromise;

    sdkPromise = (async () => {
        try {
            // Prefer CommonJS entrypoints first to avoid ESM/require WASM issues.
            const requireCandidates = [
                "@radr/shadowwire/dist/index.cjs",
                "@radr/shadowwire/dist/index.js",
                "@radr/shadowwire"
            ];

            let lastError: unknown = null;
            for (const spec of requireCandidates) {
                try {
                    const mod = nodeRequire(spec);
                    return mod as ShadowwireSdk;
                } catch (err) {
                    lastError = err;
                }
            }

            // Fallback to ESM import if require-based loading fails.
            try {
                const mod = await import("@radr/shadowwire");
                return mod as unknown as ShadowwireSdk;
            } catch (err) {
                throw lastError || err;
            }
        } catch (error) {
            if (getRuntimeMode() === "real") {
                throw error;
            }
            logger.error("Failed to load ShadowWire SDK, falling back to mock", "ShadowWire", {
                message: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    })();

    return sdkPromise;
}

async function getShadowwireClient(): Promise<any> {
    if (isMockMode()) {
        return getMockClient();
    }

    if (!clientPromise) {
        clientPromise = (async () => {
            const sdk = await loadShadowwireSdk();
            if (!sdk?.ShadowWireClient) {
                if (getRuntimeMode() === "real") {
                    throw new Error("ShadowWire SDK unavailable in real mode");
                }
                return getMockClient();
            }

            if (tokenUtilsImpl === MockTokenUtils && sdk.TokenUtils) {
                tokenUtilsImpl = sdk.TokenUtils;
            }

            return new sdk.ShadowWireClient({
                // @ts-ignore - SDK network enum is not typed for all values
                network: shadowwireNetwork(),
                debug: process.env.NODE_ENV === "development"
            });
        })();
    }

    return clientPromise;
}

// Lazy client wrapper to avoid ESM-only SDK loading in CJS runtimes
export const shadowwire = {
    async getBalance(wallet: string, token: string) {
        const client = await getShadowwireClient();
        return client.getBalance(wallet, token);
    },
    async deposit(params: any) {
        const client = await getShadowwireClient();
        return client.deposit(params);
    },
    async withdraw(params: any) {
        const client = await getShadowwireClient();
        return client.withdraw(params);
    },
    async transfer(params: any) {
        const client = await getShadowwireClient();
        return client.transfer(params);
    }
};

// Helper to get USD1 balance for a wallet
export async function getPrivateBalance(wallet: string): Promise<number> {
    try {
        const direct = await fetchShadowwireBalance(wallet, USD1_MINT);
        if (direct) {
            const rawDirect =
                typeof direct === "object"
                    ? (direct.available ?? direct.balance ?? direct.amount ?? direct.deposited ?? 0)
                    : direct;
            if (typeof rawDirect === "number" || typeof rawDirect === "string") {
                return Number(rawDirect) / 1_000_000;
            }
        }

        const client = await getShadowwireClient();
        const attempts: Array<() => Promise<any>> = [
            () => client.getBalance({ wallet, token: "USDC", token_mint: USD1_MINT }),
            () => client.getBalance({ wallet, token: "USD1", token_mint: USD1_MINT }),
            () => client.getBalance(wallet, "USDC", USD1_MINT),
            () => client.getBalance(wallet, "USD1", USD1_MINT),
            () => client.getBalance(wallet, "USDC"),
            () => client.getBalance(wallet, "USD1")
        ];

        let balanceResponse: any = null;
        let lastError: unknown = null;
        for (const attempt of attempts) {
            try {
                balanceResponse = await attempt();
                break;
            } catch (err) {
                lastError = err;
            }
        }

        if (balanceResponse == null && lastError) {
            throw lastError;
        }

        const extract = (value: any): number => {
            if (value == null) return 0;
            if (typeof value === "number") return value;
            if (typeof value === "string") return Number(value) || 0;
            if (typeof value === "object") {
                const candidates = [
                    value.available,
                    value.balance,
                    value.amount,
                    value.deposited,
                    value.total
                ];
                for (const candidate of candidates) {
                    if (typeof candidate === "number") return candidate;
                    if (typeof candidate === "string") return Number(candidate) || 0;
                }
            }
            return 0;
        };

        const rawBalance = extract(balanceResponse);

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

    try {
        return await shadowwire.transfer({
            sender,
            recipient,
            amount,
            token: "USDC",
            token_mint: USD1_MINT,
            type: "internal", // Hidden amount using ZK proofs
            wallet
        });
    } catch (error) {
        logger.error("ZK-Transfer failed", "ShadowWire", {
            message: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

// Execute an external transfer (visible amount, anonymous sender)
export async function externalTransfer(params: PrivateTransferParams) {
    const { sender, recipient, amount, wallet } = params;

    try {
        return await shadowwire.transfer({
            sender,
            recipient,
            amount,
            token: "USDC",
            token_mint: USD1_MINT,
            type: "external",
            wallet
        });
    } catch (error) {
        logger.error("External transfer failed", "ShadowWire", {
            message: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
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
        logger.error("Deposit failed", "ShadowWire", {
            message: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

// Withdraw USD1 from ShadowWire
export async function withdraw(wallet: string, amount: number) {
    logger.info("Withdraw started", "ShadowWire");

    // standard 6 decimals
    const smallestUnit = Math.floor(amount * 1_000_000);
    try {
        return await shadowwire.withdraw({
            wallet,
            // @ts-ignore
            token: "USDC",
            token_mint: USD1_MINT,
            amount: smallestUnit
        });
    } catch (error) {
        logger.error("Withdraw failed", "ShadowWire", {
            message: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}

// Export the client and utils
export const TokenUtils = {
    toSmallestUnit: (amount: number, token: string) => tokenUtilsImpl.toSmallestUnit(amount, token),
    fromSmallestUnit: (amount: number, token: string) => tokenUtilsImpl.fromSmallestUnit(amount, token)
};
