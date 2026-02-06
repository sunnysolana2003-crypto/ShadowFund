import { MarketSignals } from "./signals.js";

export type MacroMood = "risk-on" | "risk-off" | "neutral";

export function getMacroMood(signals: MarketSignals): MacroMood {
    if (signals.volatility === "high" && signals.solRSI < 30) return "risk-on";
    if (signals.volatility === "high" && signals.solRSI > 70) return "risk-off";
    if (signals.solTrend === "bearish") return "risk-off";
    return "neutral";
}
