export type RiskProfile = "low" | "medium" | "high";

export interface RiskLimits {
    reserve: number;
    yield: number;
    growth: number;
    degen: number;
}

export function getRiskLimits(risk: RiskProfile): RiskLimits {
    if (risk === "low") {
        return { reserve: 70, yield: 30, growth: 20, degen: 0 };
    }
    if (risk === "medium") {
        return { reserve: 50, yield: 40, growth: 30, degen: 10 };
    }
    return { reserve: 30, yield: 40, growth: 40, degen: 30 };
}
