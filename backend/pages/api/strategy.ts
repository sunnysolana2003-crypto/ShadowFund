import type { NextApiRequest, NextApiResponse } from "next";
import { getAIStrategy, RiskProfile } from "../../lib/ai";
import { applyCors } from "../../lib/cors";
import logger from "../../lib/logger";

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
        const { risk } = req.query;
        const riskLevel = (risk as RiskProfile) || "medium";

        logger.info("Strategy request", "STRATEGY", { risk: riskLevel });

        const strategy = await getAIStrategy(riskLevel);

        const duration = Date.now() - startTime;
        logger.api(req.method || "GET", "/api/strategy", 200, duration);

        res.status(200).json({
            ok: true,
            ...strategy,
            generatedAt: new Date().toISOString()
        });
    } catch (err) {
        logger.error("Strategy error", "STRATEGY", err instanceof Error ? { message: err.message } : { error: String(err) });
        res.status(500).json({ error: "Failed to get strategy" });
    }
}
