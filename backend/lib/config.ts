/**
 * Environment Configuration
 * Validates and exports environment variables.
 * Non-logging policy: no RPC URLs or secrets in logs.
 */
import { logger } from "./logger";

interface EnvConfig {
    // Required
    nodeEnv: string;

    // Optional with defaults
    solanaRpcUrl: string;
    shadowwireCluster: string;

    // Optional
    geminiApiKey?: string;
    shadowwireApiKey?: string;

    // Feature flags
    shadowwireMock: boolean;
}

function getEnvVar(key: string, required: boolean = false, defaultValue?: string): string | undefined {
    const value = process.env[key];

    if (!value && required && !defaultValue) {
        logger.warn("Missing required environment variable", "Config", { key });
    }

    return value || defaultValue;
}

export const config: EnvConfig = {
    nodeEnv: getEnvVar('NODE_ENV', false, 'development') as string,
    solanaRpcUrl: getEnvVar('SOLANA_RPC_URL', false, 'https://api.mainnet-beta.solana.com') as string,
    shadowwireCluster: getEnvVar('SHADOWWIRE_CLUSTER', false, 'mainnet-beta') as string,
    geminiApiKey: getEnvVar('GEMINI_API_KEY'),
    shadowwireApiKey: getEnvVar('SHADOWWIRE_API_KEY'),
    shadowwireMock: (getEnvVar('SHADOWWIRE_MOCK', false, 'true') as string) === 'true',
};

export function isProduction(): boolean {
    return config.nodeEnv === 'production';
}

export function isDevelopment(): boolean {
    return config.nodeEnv === 'development';
}

export function hasGeminiAI(): boolean {
    return !!config.geminiApiKey;
}

export function logConfig(): void {
    logger.info("Environment loaded", "Config");
}
