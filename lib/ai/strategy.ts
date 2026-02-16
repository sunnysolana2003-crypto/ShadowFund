import { MarketSignals } from "./signals.js";

export interface RiskLimits {
    reserve: number;
    yield: number;
    growth: number;
    degen: number;
    rwa: number;
}

export interface Allocation {
    reserve: number;
    yield: number;
    growth: number;
    degen: number;
    rwa: number;
}

export function buildStrategy(signals: MarketSignals, limits: RiskLimits, mood: string): Allocation {
    let reserve = 40;
    let yieldV = 30;
    let growth = 20;
    let degen = 10;
    let rwa = 0;

    // Macro regime
    if (mood === "risk-on") {
        growth += 10;
        degen += 5;
        reserve -= 15;
    }

    if (mood === "risk-off") {
        reserve += 20;
        growth -= 10;
        degen -= 10;
    }

    // Oversold SOL → accumulate
    if (signals.solRSI < 30) {
        growth += 10;
        reserve -= 10;
    }

    // Meme mania → allow degen
    if (signals.memeHype === "high") {
        degen += 5;
        reserve -= 5;
    }

    // Enforce risk hard caps
    reserve = Math.min(Math.max(reserve, 0), limits.reserve);
    yieldV = Math.min(Math.max(yieldV, 0), limits.yield);
    growth = Math.min(Math.max(growth, 0), limits.growth);
    degen = Math.min(Math.max(degen, 0), limits.degen);
    rwa = Math.min(Math.max(rwa, 0), limits.rwa);

    const total = reserve + yieldV + growth + degen + rwa;

    return {
        reserve: (reserve / total) * 100,
        yield: (yieldV / total) * 100,
        growth: (growth / total) * 100,
        degen: (degen / total) * 100,
        rwa: (rwa / total) * 100
    };
}
