import { AsyncLocalStorage } from "node:async_hooks";
import type { NextApiRequest } from "../types/api.js";

export type RuntimeMode = "demo" | "real";

type RuntimeContext = {
    mode?: RuntimeMode;
};

const storage = new AsyncLocalStorage<RuntimeContext>();

function parseMode(value?: string | string[]): RuntimeMode | undefined {
    if (!value) return undefined;
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return undefined;
    const normalized = raw.toLowerCase();
    if (normalized === "real") return "real";
    if (normalized === "demo") return "demo";
    return undefined;
}

export function withRuntimeMode<T>(req: NextApiRequest, fn: () => Promise<T>): Promise<T> {
    const headerMode = parseMode(req.headers?.["x-shadowfund-mode"]);
    const queryMode = parseMode(req.query?.["mode"]);
    const mode = headerMode || queryMode;

    return storage.run({ mode }, fn);
}

export function getRuntimeMode(): RuntimeMode | undefined {
    return storage.getStore()?.mode;
}
