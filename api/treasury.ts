import type { NextApiRequest, NextApiResponse } from "next";
import { loadTreasury } from "../lib/treasury";
import { RiskProfile } from "../lib/ai";
import { applyCors } from "../lib/cors";
import logger from "../lib/logger";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    applyCors(req, res, ["GET", "OPTIONS"]);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const startTime = Date.now();

    try {
        const { wallet, risk } = req.query;

        if (!wallet || typeof wallet !== "string") {
            return res.status(400).json({ error: "wallet parameter required" });
        }

        const riskLevel = (risk as RiskProfile) || "medium";

        logger.info("Treasury request", "TREASURY", { wallet: `${wallet.slice(0, 12)}...`, risk: riskLevel });

        // Load current USD1 state
        const data = await loadTreasury(wallet, riskLevel);

        const duration = Date.now() - startTime;
        logger.api(req.method || "GET", "/api/treasury", 200, duration);

        res.status(200).json(data);
    } catch (err) {
        logger.error("Treasury error", "TREASURY", err instanceof Error ? { message: err.message } : { error: String(err) });
        res.status(500).json({ error: "Failed to load treasury" });
    }
}
