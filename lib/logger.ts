/**
 * Structured Logger — Non-Logging Policy
 * Never logs wallets, amounts, balances, signatures, addresses, or tx hashes.
 * In production or when LOG_POLICY=minimal, only generic messages and redacted data.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
    'wallet', 'address', 'from', 'to', 'sender', 'recipient',
    'amount', 'balance', 'balances', 'fee', 'netAmount',
    'signature', 'signatures', 'txHash', 'txSignature', 'tx_signature',
    'secret', 'key', 'privateKey', 'apiKey', 'token',
    'response', 'data', 'body', 'params'
]);

function isNonLoggingPolicy(): boolean {
    return (
        process.env.NODE_ENV === 'production' ||
        (process.env.LOG_POLICY || '').toLowerCase() === 'minimal' ||
        process.env.NON_LOGGING_POLICY === 'true'
    );
}

function redact(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data === 'object' && !Array.isArray(data)) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(data)) {
            const keyLower = k.toLowerCase();
            const isSensitive = [...SENSITIVE_KEYS].some(s => keyLower.includes(s) || k.includes(s));
            out[k] = isSensitive ? '[REDACTED]' : redact(v);
        }
        return out;
    }
    if (Array.isArray(data)) return data.map(item => redact(item));
    return data;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: unknown;
}

function formatLog(entry: LogEntry): string {
    const { timestamp, level, context, message, data } = entry;
    const prefix = context ? `[${context}]` : '';
    const safeData = isNonLoggingPolicy() ? undefined : data;
    const dataStr = safeData !== undefined ? ` ${JSON.stringify(redact(safeData))}` : '';
    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${prefix} ${message}${dataStr}`;
}

function createLogEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        data
    };
}

export const logger = {
    debug: (message: string, context?: string, data?: unknown) => {
        if (process.env.NODE_ENV === 'development' && !isNonLoggingPolicy()) {
            console.log(formatLog(createLogEntry('debug', message, context, data)));
        }
    },

    info: (message: string, context?: string, data?: unknown) => {
        console.log(formatLog(createLogEntry('info', message, context, data)));
    },

    warn: (message: string, context?: string, data?: unknown) => {
        console.warn(formatLog(createLogEntry('warn', message, context, data)));
    },

    error: (message: string, context?: string, data?: unknown) => {
        console.error(formatLog(createLogEntry('error', message, context, data)));
    },

    api: (method: string, path: string, statusCode: number, durationMs: number) => {
        const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
        console.log(formatLog(createLogEntry(level, `${method} ${path} ${statusCode} ${durationMs}ms`, 'API')));
    }
};

export default logger;
