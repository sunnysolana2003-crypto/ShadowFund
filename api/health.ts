import type { NextApiRequest, NextApiResponse } from "../types/api.js";
import fs from "node:fs";
import path from "node:path";

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

    const pkgDir = path.join(process.cwd(), "node_modules", "@radr", "shadowwire");
    const wasmDir = path.join(pkgDir, "wasm");
    const installed = fs.existsSync(pkgDir);

    const wasmCandidates = ["settler_wasm.mjs", "settler_wasm.js", "settler_wasm.cjs"];
    const wasmEntry = installed
        ? wasmCandidates.find((name) => fs.existsSync(path.join(wasmDir, name))) || null
        : null;

    let wasmEsmScope: string | null = null;
    try {
        const wasmPkgPath = path.join(wasmDir, "package.json");
        if (installed && fs.existsSync(wasmPkgPath)) {
            const raw = fs.readFileSync(wasmPkgPath, "utf8");
            const parsed = raw.trim() ? JSON.parse(raw) : {};
            wasmEsmScope = typeof parsed?.type === "string" ? parsed.type : null;
        }
    } catch {
        // ignore
    }

    let wasmShimPresent = false;
    try {
        if (installed && wasmEntry) {
            const entryPath = path.join(wasmDir, wasmEntry);
            const head = fs.readFileSync(entryPath, "utf8").slice(0, 3_000);
            wasmShimPresent = head.includes("__shadowwire_node_shim__");
        }
    } catch {
        wasmShimPresent = false;
    }

    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        network: process.env.SOLANA_RPC_URL?.includes("devnet") ? "devnet" : "mainnet",
        version: "1.0.0",
        shadowwire: {
            installed,
            wasm: {
                entry: wasmEntry,
                esmScope: wasmEsmScope,
                shimPresent: wasmShimPresent
            }
        }
    });
}
