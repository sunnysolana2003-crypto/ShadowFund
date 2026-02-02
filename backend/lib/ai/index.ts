/**
 * AI Strategy Engine
 * Combines market signals with Gemini AI for intelligent allocation decisions
 */

import { getMarketSignals, MarketSignals } from "./signals";
import { getRiskLimits, RiskProfile } from "./risk";
import { getMacroMood, MacroMood } from "./macro";
import { buildStrategy, Allocation } from "./strategy";
import { getGeminiStrategy, getMarketAnalysis, isGeminiAvailable, GeminiStrategyResult } from "./gemini";

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

/**
 * Get AI-powered strategy recommendation
 * Uses Gemini AI if available, falls back to rule-based strategy
 */
export async function getAIStrategy(risk: RiskProfile): Promise<AIStrategyResult> {
    const now = Date.now();
    if (strategyCache[risk] && (now - strategyCache[risk].timestamp) < CACHE_TTL) {
        console.log(`[AI Engine] Returning cached strategy for ${risk} risk`);
        return strategyCache[risk].result;
    }

    // Fetch market signals
    const signals = await getMarketSignals();
    const limits = getRiskLimits(risk);
    const mood = getMacroMood(signals);

    // Check if Gemini AI is available
    if (isGeminiAvailable()) {
        try {
            console.log("[AI Engine] Using Gemini AI for strategy generation");

            // Get AI-powered strategy
            const geminiResult = await getGeminiStrategy(signals, limits, risk);

            // Get market analysis
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
            console.error("[AI Engine] Gemini AI failed, falling back to rules:", error);
        }
    }

    // Fallback to rule-based strategy
    console.log("[AI Engine] Using rule-based strategy");
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
