import type { NextApiRequest, NextApiResponse } from "next";
import { getAIStrategy, RiskProfile } from "../../lib/ai";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Enable CORS for frontend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const startTime = Date.now();

    try {
        const { risk } = req.query;
        const riskLevel = (risk as RiskProfile) || "medium";

        console.log("\n" + "─".repeat(50));
        console.log("\x1b[36m[STRATEGY API]\x1b[0m 📡 Strategy request received");
        console.log("\x1b[36m[STRATEGY API]\x1b[0m 🎯 Risk level:", riskLevel);
        console.log("─".repeat(50));

        const strategy = await getAIStrategy(riskLevel);

        const duration = Date.now() - startTime;

        console.log("─".repeat(50));
        console.log("\x1b[36m[STRATEGY API]\x1b[0m \x1b[32m✓ Response ready in " + duration + "ms\x1b[0m");
        console.log("─".repeat(50) + "\n");

        res.json({
            ok: true,
            ...strategy,
            generatedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error("\x1b[31m[STRATEGY API] ❌ Error:\x1b[0m", err);
        res.status(500).json({ error: "Failed to get strategy" });
    }
}
