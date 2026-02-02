import type { NextApiRequest, NextApiResponse } from "next";
import { loadTreasury } from "../../lib/treasury";
import { RiskProfile } from "../../lib/ai";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Enable CORS
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
        const { wallet, risk, simulation } = req.query;

        if (!wallet || typeof wallet !== "string") {
            return res.status(400).json({ error: "wallet parameter required" });
        }

        const riskLevel = (risk as RiskProfile) || "medium";
        const isSimulation = simulation === "true";

        console.log("\n" + "┈".repeat(50));
        console.log("\x1b[32m[TREASURY API]\x1b[0m 🏦 Fetching state for:", `\x1b[1m${wallet.slice(0, 12)}...\x1b[0m`);
        console.log("\x1b[32m[TREASURY API]\x1b[0m 🎯 Risk Profile:", riskLevel);
        console.log("\x1b[32m[TREASURY API]\x1b[0m 🎭 Simulation Mode:", isSimulation ? "ON" : "OFF");

        // Load current USD1 state
        const data = await loadTreasury(wallet, riskLevel, isSimulation);

        const duration = Date.now() - startTime;
        console.log("\x1b[32m[TREASURY API]\x1b[0m 💰 Total Balance:", `\x1b[1m$${data.totalUSD1.toLocaleString()}\x1b[0m`);
        console.log("\x1b[32m[TREASURY API]\x1b[0m ✓ Loaded in", `${duration}ms`);
        console.log("┈".repeat(50) + "\n");

        res.status(200).json(data);
    } catch (err) {
        console.error("\x1b[31m[TREASURY API] ❌ Error:\x1b[0m", err);
        res.status(500).json({ error: "Failed to load treasury" });
    }
}
