import type { NextApiRequest, NextApiResponse } from "../types/api.js";

function parseOrigins(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

function resolveRequestOrigin(req: NextApiRequest): string | undefined {
    const origin = req.headers.origin;
    return typeof origin === "string" ? origin : undefined;
}

/**
 * Apply production-safe CORS headers.
 *
 * - In production: allow only CORS_ORIGINS (comma-separated) if provided, else same-origin only.
 * - In development: default to "*" for convenience, unless CORS_ORIGINS is set.
 */
export function applyCors(req: NextApiRequest, res: NextApiResponse, methods: string[]): void {
    const env = process.env.NODE_ENV;
    const allowlist = parseOrigins(process.env.CORS_ORIGINS);
    const reqOrigin = resolveRequestOrigin(req);

    let allowOrigin: string | undefined;

    if (allowlist.length > 0) {
        // Explicit allowlist
        if (reqOrigin && allowlist.includes(reqOrigin)) {
            allowOrigin = reqOrigin;
        }
    } else if (env !== "production") {
        // Dev default
        allowOrigin = "*";
    } else {
        // Production default: do not set Allow-Origin unless origin matches same-origin.
        // (On same-origin requests, browsers don't require CORS headers.)
        allowOrigin = undefined;
    }

    if (allowOrigin) {
        res.setHeader("Access-Control-Allow-Origin", allowOrigin);
        // Only set Vary when not wildcard
        if (allowOrigin !== "*") res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Shadowfund-Mode");
}
