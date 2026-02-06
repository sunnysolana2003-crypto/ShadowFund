/**
 * Gemini AI Integration for Treasury Strategy
 * Uses Google's Gemini 3 Flash model for intelligent allocation recommendations
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MarketSignals } from "./signals.js";
import { RiskLimits } from "./risk.js";
import { Allocation } from "./strategy.js";
import { logger } from "../logger.js";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are ShadowFund's AI Treasury Manager - an expert in DeFi portfolio management, risk assessment, and capital allocation.

Your role is to analyze market conditions and recommend optimal allocation percentages across 4 vaults:
- **Reserve**: High-liquidity stable buffer (USD1 stablecoins, lowest risk)
- **Yield**: Optimized stablecoin farming (lending protocols, medium-low risk)
- **Growth**: Balanced market exposure (blue-chip tokens, medium risk)
- **Degen**: High-risk delta neutral strategies (meme coins, highest risk)

You must always return a JSON response with this exact structure:
{
  "allocation": {
    "reserve": <number 0-100>,
    "yield": <number 0-100>,
    "growth": <number 0-100>,
    "degen": <number 0-100>
  },
  "reasoning": "<string explaining your decision>",
  "confidence": <number 0-100>,
  "marketMood": "<risk-on | risk-off | neutral>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}

The allocation percentages must sum to 100. Consider the user's risk profile when making recommendations.`;

export interface GeminiStrategyResult {
    allocation: Allocation;
    reasoning: string;
    confidence: number;
    marketMood: "risk-on" | "risk-off" | "neutral";
    keyInsights: string[];
}

export async function getGeminiStrategy(
    signals: MarketSignals,
    limits: RiskLimits,
    riskProfile: "low" | "medium" | "high"
): Promise<GeminiStrategyResult> {
    logger.info("Starting AI strategy generation", "Gemini");
    const startTime = Date.now();

    try {

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                temperature: 0.5,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
Analyze the following market conditions and recommend an optimal treasury allocation:

## Current Market Data
- **SOL Trend**: ${signals.solTrend}
- **SOL RSI (14-period)**: ${signals.solRSI.toFixed(1)} ${signals.solRSI < 30 ? "(oversold)" : signals.solRSI > 70 ? "(overbought)" : "(neutral)"}
- **Market Volatility**: ${signals.volatility}
- **Meme Coin Activity**: ${signals.memeHype}

## User Risk Profile: ${riskProfile.toUpperCase()}
Risk limits (maximum % per vault):
- Reserve: ${limits.reserve}%
- Yield: ${limits.yield}%
- Growth: ${limits.growth}%
- Degen: ${limits.degen}%

## Instructions
1. Analyze the market conditions
2. Consider the user's risk tolerance
3. Recommend allocation percentages that sum to 100%
4. Ensure no vault exceeds its risk limit
5. Provide clear reasoning for your decision

Return your response as valid JSON only, no markdown formatting.`;

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: prompt }
        ]);

        let response = result.response.text();

        // Strip markdown code blocks if present
        response = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

        // Parse the JSON response - try to find the JSON object
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            logger.error("Failed to parse Gemini response", "Gemini");
            throw new Error("Failed to parse Gemini response as JSON");
        }

        const parsed = JSON.parse(jsonMatch[0]) as GeminiStrategyResult;

        // Validate and normalize allocation
        const { allocation } = parsed;
        const total = allocation.reserve + allocation.yield + allocation.growth + allocation.degen;

        // Normalize to 100% if needed
        if (Math.abs(total - 100) > 0.1) {
            logger.info("Normalizing allocation", "Gemini");
            allocation.reserve = (allocation.reserve / total) * 100;
            allocation.yield = (allocation.yield / total) * 100;
            allocation.growth = (allocation.growth / total) * 100;
            allocation.degen = (allocation.degen / total) * 100;
        }

        // Enforce risk limits
        allocation.reserve = Math.min(allocation.reserve, limits.reserve);
        allocation.yield = Math.min(allocation.yield, limits.yield);
        allocation.growth = Math.min(allocation.growth, limits.growth);
        allocation.degen = Math.min(allocation.degen, limits.degen);

        const duration = Date.now() - startTime;

        console.log("\x1b[35m[GEMINI AI]\x1b[0m \x1b[32m✓ Strategy generated in " + duration + "ms\x1b[0m");
        console.log("\x1b[35m[GEMINI AI]\x1b[0m 🎭 Market Mood:", parsed.marketMood);
        console.log("\x1b[35m[GEMINI AI]\x1b[0m 📊 Confidence:", parsed.confidence + "%");
        console.log("\x1b[35m[GEMINI AI]\x1b[0m 📈 Allocation:", JSON.stringify(allocation));
        if (parsed.keyInsights?.length) {
            console.log("\x1b[35m[GEMINI AI]\x1b[0m 💡 Key Insights:");
            parsed.keyInsights.forEach((insight, i) => {
                console.log("\x1b[35m[GEMINI AI]\x1b[0m    " + (i + 1) + ". " + insight.slice(0, 80) + (insight.length > 80 ? "..." : ""));
            });
        }

        return parsed;
    } catch (error) {
        console.error("[Gemini AI] Error generating strategy:", error);
        throw error;
    }
}

/**
 * Get AI-powered market analysis
 */
export async function getMarketAnalysis(signals: MarketSignals): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `
As a crypto market analyst, provide a brief 2-3 sentence analysis of these conditions:
- SOL Trend: ${signals.solTrend}
- RSI: ${signals.solRSI.toFixed(1)}
- Volatility: ${signals.volatility}
- Meme Activity: ${signals.memeHype}

Be concise and actionable. No markdown, just plain text.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch {
        logger.warn("Market analysis error", "Gemini");
        return "Market analysis temporarily unavailable.";
    }
}

/**
 * Check if Gemini AI is available
 */
export function isGeminiAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
}
