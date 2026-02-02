import { verifySignature } from "../utils/verifySignature";
import type { NextApiRequest, NextApiResponse } from "next";

interface AuthRequest extends NextApiRequest {
    body: {
        wallet?: string;
        timestamp?: string | number;
        signature?: string;
        action?: string;
    };
}

export function requireSignature(req: AuthRequest, res: NextApiResponse): boolean {
    const { wallet, timestamp, signature, action } = req.body || {};

    if (!wallet || !timestamp || !signature || !action) {
        res.status(400).json({ error: "Missing authorization fields" });
        return false;
    }

    const now = Date.now();
    if (Math.abs(now - Number(timestamp)) > 60_000) {
        res.status(401).json({ error: "Signature expired" });
        return false;
    }

    const message = `${action}|${wallet}|${timestamp}`;

    if (!verifySignature(message, signature, wallet)) {
        res.status(401).json({ error: "Invalid signature" });
        return false;
    }

    return true;
}
