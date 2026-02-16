/**
 * ShadowFund API Service
 * Connects frontend to backend API endpoints
 */

// @ts-ignore - Vite provides this
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || "";

export interface Vault {
    id: "reserve" | "yield" | "growth" | "degen" | "rwa";
    address: string;
    balance: number;
}

type VaultId = "reserve" | "yield" | "growth" | "degen" | "rwa";

export interface Treasury {
    totalUSD1: number;
    walletBalance: number;
    publicBalance: number;
    vaults: Vault[];
    risk: "low" | "medium" | "high";
}

export interface Allocation {
    reserve: number;
    yield: number;
    growth: number;
    degen: number;
    rwa: number;
}

export interface MarketSignals {
    solTrend: "bullish" | "bearish";
    solRSI: number;
    memeHype: "high" | "medium" | "low";
    volatility: "high" | "medium" | "low";
}

export interface AIStrategy {
    signals: MarketSignals;
    mood: "risk-on" | "risk-off" | "neutral";
    allocation: Allocation;
    // Gemini AI enhancements
    aiPowered: boolean;
    reasoning?: string;
    confidence?: number;
    keyInsights?: string[];
    marketAnalysis?: string;
    generatedAt?: string;
}


// Token position in Growth/Degen vaults
export interface TokenPosition {
    token: {
        mint: string;
        symbol: string;
        decimals: number;
        price?: number;
    };
    amount: number;
    valueUSD: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
}

// Vault stats returned after rebalancing
export interface VaultStats {
    reserve: {
        balance: number;
        percentage: number;
    };
    yield: {
        balance: number;
        percentage: number;
        apy: number;
        earnedYield: number;
    };
    growth: {
        balance: number;
        percentage: number;
        positions: TokenPosition[];
        pnl: number;
    };
    degen: {
        balance: number;
        percentage: number;
        positions: TokenPosition[];
        pnl: number;
    };
    rwa: {
        balance: number;
        percentage: number;
        positions: TokenPosition[];
        pnl: number;
    };
    total: number;
}

export interface RebalanceResult {
    ok: boolean;
    message: string;
    strategy: {
        signals: MarketSignals;
        mood: "risk-on" | "risk-off" | "neutral";
        allocation: Allocation;
        aiPowered: boolean;
        reasoning?: string;
        confidence?: number;
    };
    execution: {
        usd1Transfers: Array<{
            vault: string;
            direction: "in" | "out";
            amount: number;
            txHash: string;
        }>;
        unsignedTxs?: string[];
        strategyResults: {
            reserve: { success: boolean; transactions: number };
            yield: { success: boolean; apy: number; earned: number; transactions: number };
            growth: { success: boolean; positions: number; pnl: number; transactions: number };
            degen: { success: boolean; positions: number; pnl: number; transactions: number };
            rwa: { success: boolean; positions: number; pnl: number; transactions: number };
        };
        totalTransactions: number;
    };
    vaultStats: VaultStats;
    errors?: string[];
    fees: {
        percentage: number;
        minimum: number;
    };
    duration: string;
}

export interface ProofVerification {
    verified: boolean;
    proof: {
        valid: boolean;
        proofType: string;
        timestamp: number;
        zkCircuit: string;
    };
}

export interface ManualInvestResult {
    ok: boolean;
    message: string;
    allocation: Allocation;
    execution: {
        investAmount: number;
        perVaultAmounts: Record<VaultId, number>;
        usd1Transfers: Array<{
            vault: string;
            direction: "in";
            amount: number;
            txHash?: string;
        }>;
        usd1Errors?: Array<{ vault: string; error: string }>;
        unsignedTxs?: string[];
        strategyResults: Record<string, any>;
        totalTransactions: number;
    };
    vaultStats: VaultStats;
    errors?: string[];
    duration: string;
}

class ShadowFundAPI {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE) {
        this.baseUrl = baseUrl;
    }

    private getRuntimeHeaders(): Record<string, string> {
        if (typeof window === "undefined") return {};
        try {
            const stored = window.localStorage.getItem("shadowfund-mode");
            const fallback =
                (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SHADOWWIRE_MOCK === "true")
                    ? "demo"
                    : "real";
            const mode = stored === "demo" || stored === "real" ? stored : fallback;
            return { "x-shadowfund-mode": mode };
        } catch {
            return {};
        }
    }

    private withRuntimeHeaders(init: RequestInit = {}): RequestInit {
        const headers = {
            ...(init.headers as Record<string, string> | undefined),
            ...this.getRuntimeHeaders()
        };
        return { ...init, headers };
    }

    /**
     * Fetch treasury data for a wallet
     */
    async getTreasury(wallet: string, risk: "low" | "medium" | "high" = "medium"): Promise<Treasury> {
        const params = new URLSearchParams({ wallet, risk });
        const response = await fetch(
            `${this.baseUrl}/api/treasury?${params}`,
            this.withRuntimeHeaders()
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch treasury: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get AI strategy recommendations
     */
    async getStrategy(risk: "low" | "medium" | "high" = "medium"): Promise<AIStrategy> {
        const params = new URLSearchParams({ risk });
        const response = await fetch(
            `${this.baseUrl}/api/strategy?${params}`,
            this.withRuntimeHeaders()
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch strategy: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Execute treasury rebalance
     */
    async rebalance(
        wallet: string,
        risk: "low" | "medium" | "high" = "medium",
        signature?: { timestamp: number; signature: string; action: string }
    ): Promise<RebalanceResult> {
        const response = await fetch(`${this.baseUrl}/api/rebalance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getRuntimeHeaders()
            },
            body: JSON.stringify({
                wallet,
                risk,
                ...signature,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to rebalance: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Manual invest into selected vaults
     */
    async invest(
        wallet: string,
        amount: number,
        allocations: Partial<Record<VaultId, number>>,
        signature?: { timestamp: number; signature: string; action: string }
    ): Promise<ManualInvestResult> {
        const response = await fetch(`${this.baseUrl}/api/invest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getRuntimeHeaders()
            },
            body: JSON.stringify({
                wallet,
                amount,
                allocations,
                ...signature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Manual invest failed: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return response.json();
    }

    /**
     * Verify a ZK proof for a transaction
     */
    async verifyProof(txHash: string): Promise<ProofVerification> {
        const params = new URLSearchParams({ txHash });
        const response = await fetch(
            `${this.baseUrl}/api/verify?${params}`,
            this.withRuntimeHeaders()
        );

        if (!response.ok) {
            throw new Error(`Failed to verify proof: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Sign a message for authenticated requests (to be used with wallet adapter)
     */
    createSignaturePayload(action: string, wallet: string): { message: string; timestamp: number } {
        const timestamp = Date.now();
        const message = `${action}|${wallet}|${timestamp}`;
        return { message, timestamp };
    }

    /**
     * Deposit USDC into treasury
     */
    async deposit(
        wallet: string,
        amount: number,
        signature?: { timestamp: number; signature: string }
    ): Promise<{ ok: boolean; action: string; amount: number; result: any }> {
        const response = await fetch(`${this.baseUrl}/api/transfer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getRuntimeHeaders()
            },
            body: JSON.stringify({
                wallet,
                amount,
                action: "deposit",
                ...signature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `Deposit failed: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return response.json();
    }

    /**
     * Withdraw USDC from treasury to wallet
     */
    async withdraw(
        wallet: string,
        amount: number,
        signature?: { timestamp: number; signature: string }
    ): Promise<{ ok: boolean; action: string; amount: number; result: any }> {
        const response = await fetch(`${this.baseUrl}/api/transfer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getRuntimeHeaders()
            },
            body: JSON.stringify({
                wallet,
                amount,
                action: "withdraw",
                ...signature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `Withdrawal failed: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return response.json();
    }

    /**
     * Get supported tokens and their fees
     */
    async getTokenInfo(): Promise<{
        feePercentage: number;
        minimumAmount: number;
        decimals: number;
    }> {
        // USDC token info
        return {
            feePercentage: 1, // 1% fee for USDC
            minimumAmount: 0.01,
            decimals: 6
        };
    }

    /**
     * Withdraw from a specific vault back to shielded USD1 pool
     */
    async withdrawFromVault(
        wallet: string,
        vault: "reserve" | "yield" | "growth" | "degen" | "rwa",
        amount: number,
        signature?: { timestamp: number; signature: string }
    ): Promise<{
        ok: boolean;
        vault: string;
        amountRequested: number;
        usd1Received: number;
        txSignature?: string;
        unsigned_txs?: string[];
        message: string;
    }> {
        const response = await fetch(`${this.baseUrl}/api/vault-withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.getRuntimeHeaders()
            },
            body: JSON.stringify({
                wallet,
                vault,
                amount,
                ...signature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Vault withdrawal failed: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return response.json();
    }
}

// Export singleton instance
export const api = new ShadowFundAPI();

// Export class for custom instances
export { ShadowFundAPI };
