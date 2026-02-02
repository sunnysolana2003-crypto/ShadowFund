/**
 * ShadowWire Integration
 * 
 * Supports two modes:
 * - MOCK MODE (SHADOWWIRE_MOCK=true): Simulates ShadowWire for devnet testing
 * - REAL MODE: Uses @radr/shadowwire SDK for mainnet production
 * 
 * The mock mode bypasses the relayer entirely, allowing full end-to-end
 * testing when ShadowWire's devnet relayer doesn't support our mints.
 */

import { ShadowWireClient, TokenUtils } from "@radr/shadowwire";
import { MockShadowWireClient, MockTokenUtils, setMockBalance, getMockBalances } from "./shadowwire-mock";

// Determine if we're in mock mode
const USE_MOCK = process.env.SHADOWWIRE_MOCK === 'true';

// Color codes for logging
const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    red: "\x1b[31m"
};

if (USE_MOCK) {
    console.log(`${COLORS.magenta}[ShadowWire]${COLORS.reset} ${COLORS.yellow}⚠ MOCK MODE ENABLED${COLORS.reset} - No real relayer calls`);
    console.log(`${COLORS.magenta}[ShadowWire]${COLORS.reset} ${COLORS.yellow}  Set SHADOWWIRE_MOCK=false for production${COLORS.reset}`);
} else {
    console.log(`${COLORS.green}[ShadowWire]${COLORS.reset} Initializing SDK for Mainnet...`);
}

// Initialize the appropriate client
const client = USE_MOCK 
    ? new MockShadowWireClient({ network: 'devnet', debug: true })
    : new ShadowWireClient({ network: 'mainnet-beta', debug: process.env.NODE_ENV === "development" });

// Token utilities (mock or real)
const tokenUtils = USE_MOCK ? MockTokenUtils : TokenUtils;

// Interface for transfer parameters
export interface PrivateTransferParams {
    sender: string;
    recipient: string;
    amount: number;
    wallet?: {
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };
}

// Export the client directly if needed for advanced usage
export const shadowwire = client;
export { ShadowWireClient, TokenUtils };

// Export mock utilities for testing/debugging
export { setMockBalance, getMockBalances };

/**
 * Check if mock mode is active
 */
export function isMockMode(): boolean {
    return USE_MOCK;
}

/**
 * Get private balance (shielded)
 */
export async function getPrivateBalance(wallet: string): Promise<number> {
    try {
        const balanceResponse = await client.getBalance(wallet, 'USD1');

        // Handle response format if it returns object or number
        if (typeof balanceResponse === 'object' && balanceResponse !== null) {
            const raw = (balanceResponse as any).available || (balanceResponse as any).balance || 0;
            return tokenUtils.fromSmallestUnit(Number(raw), 'USD1');
        }

        return tokenUtils.fromSmallestUnit(Number(balanceResponse), 'USD1');
    } catch (error) {
        console.error("Error fetching private balance:", error);
        return 0;
    }
}

/**
 * Get public balance (on-chain)
 */
export async function getPublicBalance(wallet: string): Promise<number> {
    // In mock mode, we don't have real on-chain balances
    // Return a simulated public balance for testing
    if (USE_MOCK) {
        // For mock mode, simulate having some public USDC for deposits
        // In real testing, you'd airdrop devnet USDC to your wallet
        return 1000; // $1000 simulated public balance
    }

    const { connection } = await import("./rpc");
    const { PublicKey } = await import("@solana/web3.js");

    // USD1 Mint (Mainnet)
    const USD1_MINT = new PublicKey("USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB");

    try {
        const pubkey = new PublicKey(wallet);
        const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, { mint: USD1_MINT });
        if (accounts.value.length === 0) return 0;
        const amount = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        return typeof amount === "number" ? amount : 0;
    } catch (error) {
        console.error("Error fetching public balance:", error);
        return 0;
    }
}

/**
 * Deposit public USD1 into private balance
 */
export async function deposit(wallet: string, amount: number) {
    console.log(`${COLORS.cyan}[ShadowWire]${COLORS.reset} Deposit: ${amount} USD1 -> ${wallet.slice(0, 8)}...${USE_MOCK ? ' (MOCK)' : ''}`);

    // Convert to smallest unit (USD1 = 6 decimals)
    const smallestUnit = tokenUtils.toSmallestUnit(amount, 'USD1');

    if (USE_MOCK) {
        return await (client as MockShadowWireClient).deposit({
            wallet,
            amount: smallestUnit,
            token: 'USD1'
        });
    }

    return await (client as ShadowWireClient).deposit({
        wallet,
        amount: smallestUnit,
        // @ts-ignore - SDK might infer token from mint or require symbol
        token: 'USD1'
    });
}

/**
 * Withdraw private USD1 to public wallet
 */
export async function withdraw(wallet: string, amount: number) {
    console.log(`${COLORS.cyan}[ShadowWire]${COLORS.reset} Withdraw: ${amount} USD1 <- ${wallet.slice(0, 8)}...${USE_MOCK ? ' (MOCK)' : ''}`);

    const smallestUnit = tokenUtils.toSmallestUnit(amount, 'USD1');

    if (USE_MOCK) {
        return await (client as MockShadowWireClient).withdraw({
            wallet,
            amount: smallestUnit,
            token: 'USD1'
        });
    }

    return await (client as ShadowWireClient).withdraw({
        wallet,
        amount: smallestUnit,
        // @ts-ignore
        token: 'USD1'
    });
}

/**
 * Internal Transfer: Private -> Private
 */
export async function privateTransfer(params: PrivateTransferParams) {
    console.log(`${COLORS.cyan}[ShadowWire]${COLORS.reset} Private Transfer: ${params.amount} USD1 | ${params.sender.slice(0, 8)}... -> ${params.recipient.slice(0, 8)}...${USE_MOCK ? ' (MOCK)' : ''}`);

    return await client.transfer({
        sender: params.sender,
        recipient: params.recipient,
        amount: params.amount,
        token: 'USD1',
        type: 'internal',
        wallet: params.wallet
    });
}

/**
 * External Transfer: Private -> Public (Anonymous Sender)
 */
export async function externalTransfer(params: PrivateTransferParams) {
    console.log(`${COLORS.cyan}[ShadowWire]${COLORS.reset} External Transfer: ${params.amount} USD1 | ${params.sender.slice(0, 8)}... -> ${params.recipient.slice(0, 8)}...${USE_MOCK ? ' (MOCK)' : ''}`);

    return await client.transfer({
        sender: params.sender,
        recipient: params.recipient,
        amount: params.amount,
        token: 'USD1',
        type: 'external',
        wallet: params.wallet
    });
}

// Export utilities for fees
export const USD1Utils = {
    toSmallestUnit: (amount: number) => tokenUtils.toSmallestUnit(amount, 'USD1'),
    fromSmallestUnit: (amount: number) => tokenUtils.fromSmallestUnit(amount, 'USD1'),
    getFee: () => USE_MOCK ? 1 : (client as ShadowWireClient).getFeePercentage('USD1'),
    getMinimum: () => USE_MOCK ? 0.01 : (client as ShadowWireClient).getMinimumAmount('USD1'),
    calculateFee: (amount: number) => {
        if (USE_MOCK) {
            const fee = amount * 0.01;
            return { fee, netAmount: amount - fee };
        }
        return (client as ShadowWireClient).calculateFee(amount, 'USD1');
    }
};
