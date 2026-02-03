import { getVaultStats } from "./strategies";
import { getUSD1Balance, getPublicUSD1Balance } from "./usd1";
import { Treasury, RiskProfile } from "../types";
import { logger } from "./logger";

export async function loadTreasury(wallet: string, risk: RiskProfile): Promise<Treasury> {
    // Fetch high-fidelity vault stats (Cash + Positions)
    const stats = await getVaultStats(wallet);

    // Fetch main wallet private balance (unallocated cash)
    const walletBalance = await getUSD1Balance(wallet);

    // Fetch main wallet public balance (on-chain USDC)
    const publicBalance = await getPublicUSD1Balance(wallet);

    // Total = Vaults Value + Unallocated Cash
    let totalUSD1 = stats.total + walletBalance;
    let vaultBalances = {
        reserve: stats.reserve.balance,
        yield: stats.yield.balance,
        growth: stats.growth.balance,
        degen: stats.degen.balance,
    };

    // DEMO MODE: Auto-simulate when real balances are < $1 but public balance exists
    // (Using threshold to handle dust balances like $0.113 from SOL conversion)
    if (totalUSD1 < 1 && publicBalance > 0) {
        logger.info("Demo mode: auto-simulating portfolio", "TREASURY");
        totalUSD1 = publicBalance;

        // Simulate vault allocations based on risk profile.
        // RiskProfile is "low" | "medium" | "high" across the entire codebase.
        const allocations =
            risk === "high"
                ? { reserve: 0.10, yield: 0.30, growth: 0.40, degen: 0.20 }
                : risk === "low"
                    ? { reserve: 0.40, yield: 0.40, growth: 0.15, degen: 0.05 }
                    : { reserve: 0.20, yield: 0.40, growth: 0.30, degen: 0.10 }; // medium

        vaultBalances = {
            reserve: publicBalance * allocations.reserve,
            yield: publicBalance * allocations.yield,
            growth: publicBalance * allocations.growth,
            degen: publicBalance * allocations.degen,
        };

    }

    return {
        totalUSD1,
        walletBalance,
        publicBalance,
        vaults: [
            { id: "reserve", address: "Reserve", balance: vaultBalances.reserve },
            { id: "yield", address: "Yield", balance: vaultBalances.yield },
            { id: "growth", address: "Growth", balance: vaultBalances.growth },
            { id: "degen", address: "Degen", balance: vaultBalances.degen }
        ],
        risk
    };
}
