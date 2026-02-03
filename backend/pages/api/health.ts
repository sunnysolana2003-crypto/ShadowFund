import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Health check endpoint
 * GET /api/health
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        network: process.env.SOLANA_RPC_URL?.includes("devnet") ? "devnet" : "mainnet",
        version: "1.0.0"
    });
}
