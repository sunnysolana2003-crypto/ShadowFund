export type VaultId = "reserve" | "yield" | "growth" | "degen" | "rwa";

export interface Vault {
    id: VaultId;
    address: string;
    balance: number;
}

export type { RiskProfile } from "./lib/ai/risk";

export interface Treasury {
    totalUSD1: number;
    walletBalance: number;
    publicBalance: number;
    vaults: Vault[];
    risk: RiskProfile;
}
