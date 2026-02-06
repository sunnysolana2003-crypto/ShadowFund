/**
 * AI Strategy Engine
 * Combines market signals with Gemini AI for intelligent allocation decisions.
 * Non-logging policy: no risk/signals/allocation in logs.
 */
import { logger } from "../logger.js";
import { getMarketSignals, MarketSignals } from "./signals.js";
import { getRiskLimits, RiskProfile } from "./risk.js";
import { getMacroMood, MacroMood } from "./macro.js";
import { buildStrategy, Allocation } from "./strategy.js";
import { getGeminiStrategy, getMarketAnalysis, isGeminiAvailable, GeminiStrategyResult } from "./gemini.js";

export interface AIStrategyResult {
    signals: MarketSignals;
    mood: MacroMood;
    allocation: Allocation;
    // Gemini AI enhancements
    aiPowered: boolean;
    reasoning?: string;
    confidence?: number;
    keyInsights?: string[];
    marketAnalysis?: string;
}

// Simple in-memory cache to prevent hitting Gemini rate limits
const strategyCache: Record<string, { result: AIStrategyResult; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let geminiCooldownUntil = 0;

function parseRetryDelayMs(error: any): number | null {
    const details = error?.errorDetails;
    if (!Array.isArray(details)) return null;
    for (const detail of details) {
        const retry = detail?.retryDelay;
        if (typeof retry === "string") {
            const match = retry.match(/(\d+(?:\.\d+)?)(s|ms)?/i);
            if (match) {
                const value = Number(match[1]);
                const unit = match[2]?.toLowerCase() || "s";
                return unit === "ms" ? value : value * 1000;
            }
        }
    }
    return null;
}

function isRateLimitError(error: any): boolean {
    const status = error?.status;
    if (status === 429) return true;
    const msg = String(error?.message || "").toLowerCase();
    return msg.includes("too many requests") || msg.includes("quota") || msg.includes("rate limit");
}

/**
 * Get AI-powered strategy recommendation
 * Uses Gemini AI if available, falls back to rule-based strategy
 */
export async function getAIStrategy(risk: RiskProfile): Promise<AIStrategyResult> {
    const now = Date.now();
    if (strategyCache[risk] && (now - strategyCache[risk].timestamp) < CACHE_TTL) {
        logger.info("Returning cached strategy", "AI");
        return strategyCache[risk].result;
    }

    // Fetch market signals
    const signals = await getMarketSignals();
    const limits = getRiskLimits(risk);
    const mood = getMacroMood(signals);

    // Check if Gemini AI is available and not in cooldown
    if (isGeminiAvailable() && Date.now() >= geminiCooldownUntil) {
        try {
            logger.info("Using Gemini AI", "AI");

            // Get AI-powered strategy
            const geminiResult = await getGeminiStrategy(signals, limits, risk);
            const marketAnalysis = await getMarketAnalysis(signals);

            const result = {
                signals,
                mood: geminiResult.marketMood || mood,
                allocation: geminiResult.allocation,
                aiPowered: true,
                reasoning: geminiResult.reasoning,
                confidence: geminiResult.confidence,
                keyInsights: geminiResult.keyInsights,
                marketAnalysis
            };

            strategyCache[risk] = { result, timestamp: now };
            return result;
        } catch (error) {
            if (isRateLimitError(error)) {
                const retryMs = parseRetryDelayMs(error) ?? 60_000;
                geminiCooldownUntil = Date.now() + retryMs;
                logger.warn(`Gemini rate-limited. Cooling down for ${Math.ceil(retryMs / 1000)}s`, "AI");
            } else {
                logger.warn("Gemini AI failed, falling back to rules", "AI");
            }
        }
    }

    // Fallback to rule-based strategy
    logger.info("Using rule-based strategy", "AI");
    const allocation = buildStrategy(signals, limits, mood);

    const fallbackResult = {
        signals,
        mood,
        allocation,
        aiPowered: false,
        reasoning: "Strategy generated using rule-based analysis",
        confidence: 75
    };

    // We don't cache fallback as we want to retry Gemini soon
    return fallbackResult;
}

/**
 * Get quick market mood without full strategy calculation
 */
export async function getQuickMood(): Promise<{ mood: MacroMood; signals: MarketSignals }> {
    const signals = await getMarketSignals();
    const mood = getMacroMood(signals);
    return { mood, signals };
}

// Re-export types for external use
export type { MarketSignals, RiskProfile, MacroMood, Allocation };
