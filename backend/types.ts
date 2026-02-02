export type VaultId = "reserve" | "yield" | "growth" | "degen";

export interface Vault {
    id: VaultId;
    address: string;
    balance: number;
}

export interface Treasury {
    totalUSD1: number;
    walletBalance: number;
    publicBalance: number;
    vaults: Vault[];
    risk: "low" | "medium" | "high";
}

export type RiskProfile = "low" | "medium" | "high";
