/**
 * Rate Limiting Middleware
 * Prevents API abuse in production
 */

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60  // 60 requests per minute
};

export function getRateLimitKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`;
}

export function checkRateLimit(
    ip: string,
    endpoint: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
    const key = getRateLimitKey(ip, endpoint);
    const now = Date.now();

    let record = requestCounts.get(key);

    // Initialize or reset if window expired
    if (!record || now > record.resetTime) {
        record = {
            count: 0,
            resetTime: now + config.windowMs
        };
    }

    record.count++;
    requestCounts.set(key, record);

    const remaining = Math.max(0, config.maxRequests - record.count);
    const resetIn = Math.max(0, record.resetTime - now);

    return {
        allowed: record.count <= config.maxRequests,
        remaining,
        resetIn
    };
}

/**
 * Clean up expired rate limit records (call periodically)
 */
export function cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(key);
        }
    }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * Get client IP from request
 */
export function getClientIP(req: any): string {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}
