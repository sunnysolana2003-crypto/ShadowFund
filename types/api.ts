/**
 * Vite API Request/Response Types
 * These types replace Next.js API types for Vite-based API routes
 */

export interface ApiRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, string | string[] | undefined>;
    body: any;
    url?: string;
}

export interface ApiResponse {
    status(code: number): ApiResponse;
    json(data: any): void;
    end(): void;
    setHeader(name: string, value: string): void;
}

// Type aliases for compatibility
export type NextApiRequest = ApiRequest;
export type NextApiResponse = ApiResponse;
