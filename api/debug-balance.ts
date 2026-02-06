import type { NextApiRequest, NextApiResponse } from "../types/api.js";
import { getPublicUSD1Balance } from "../lib/usd1.js";
import { applyCors } from "../lib/cors.js";
import logger from "../lib/logger.js";
import { withRuntimeMode } from "../lib/runtimeMode.js";

/**
 * Debug endpoint to test USD1 balance fetching
 * GET /api/debug-balance?wallet=<address>
 */
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

    return withRuntimeMode(req, async () => {
        try {
            const { wallet } = req.query;

            if (!wallet || typeof wallet !== "string") {
                return res.status(400).json({ error: "wallet parameter required" });
            }

            logger.info("Debug balance check requested", "DEBUG", {
                wallet: `${wallet.slice(0, 8)}...${wallet.slice(-8)}`
            });

            const balance = await getPublicUSD1Balance(wallet);

            logger.info("Debug balance result", "DEBUG", { balance });

            res.status(200).json({
                success: true,
                wallet: wallet,
                balance: balance,
                mint: "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
                network: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            logger.error("Debug balance error", "DEBUG", err instanceof Error ? { message: err.message } : { error: String(err) });
            res.status(500).json({
                success: false,
                error: "Failed to fetch balance",
                details: err instanceof Error ? err.message : String(err)
            });
        }
    });
}
