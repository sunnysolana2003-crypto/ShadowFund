/**
 * Structured Logger
 * Provides consistent logging format for production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
}

function formatLog(entry: LogEntry): string {
    const { timestamp, level, context, message, data } = entry;
    const prefix = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${prefix} ${message}${dataStr}`;
}

function createLogEntry(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        data
    };
}

export const logger = {
    debug: (message: string, context?: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatLog(createLogEntry('debug', message, context, data)));
        }
    },

    info: (message: string, context?: string, data?: any) => {
        console.log(formatLog(createLogEntry('info', message, context, data)));
    },

    warn: (message: string, context?: string, data?: any) => {
        console.warn(formatLog(createLogEntry('warn', message, context, data)));
    },

    error: (message: string, context?: string, data?: any) => {
        console.error(formatLog(createLogEntry('error', message, context, data)));
    },

    api: (method: string, path: string, statusCode: number, durationMs: number) => {
        const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
        console.log(formatLog(createLogEntry(level, `${method} ${path} ${statusCode} ${durationMs}ms`, 'API')));
    }
};

export default logger;
