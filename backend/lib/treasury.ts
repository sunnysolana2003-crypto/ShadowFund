import { getVaultStats } from "./strategies";
import { getUSD1Balance, getPublicUSD1Balance } from "./usd1";
import { Treasury, RiskProfile } from "../types";

export async function loadTreasury(wallet: string, risk: RiskProfile, isSimulation: boolean = false): Promise<Treasury> {
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

    // DEMO MODE: Auto-simulate when explicitly requested via isSimulation flag
    // OR as a fallback when real balances are < $1 but public balance exists
    // ONLY if isSimulation is not explicitly false
    if (isSimulation && publicBalance > 0) {
        console.log(`\x1b[35m[TREASURY]\x1b[0m 🎭 EXPLICIT SIMULATION - Portfolio: $${publicBalance}`);

        // Use public balance as total
        totalUSD1 = publicBalance;

        // Simulate vault allocations based on risk profile
        const allocations = risk === 'aggressive'
            ? { reserve: 0.10, yield: 0.30, growth: 0.40, degen: 0.20 }
            : risk === 'conservative'
                ? { reserve: 0.40, yield: 0.40, growth: 0.15, degen: 0.05 }
                : { reserve: 0.20, yield: 0.40, growth: 0.30, degen: 0.10 }; // medium

        vaultBalances = {
            reserve: publicBalance * allocations.reserve,
            yield: publicBalance * allocations.yield,
            growth: publicBalance * allocations.growth,
            degen: publicBalance * allocations.degen,
        };

        console.log(`\x1b[35m[TREASURY]\x1b[0m 📊 Vault simulation:`, vaultBalances);
    } else if (isSimulation !== false && totalUSD1 < 1 && publicBalance > 0) {
        // Auto-fallback only if simulation isn't explicitly disabled
        console.log(`\x1b[35m[TREASURY]\x1b[0m 🎭 AUTO SIMULATION - Portfolio: $${publicBalance}`);
        
        // Same logic as above for auto-fallback
        totalUSD1 = publicBalance;
        const allocations = risk === 'aggressive'
            ? { reserve: 0.10, yield: 0.30, growth: 0.40, degen: 0.20 }
            : risk === 'conservative'
                ? { reserve: 0.40, yield: 0.40, growth: 0.15, degen: 0.05 }
                : { reserve: 0.20, yield: 0.40, growth: 0.30, degen: 0.10 };

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
