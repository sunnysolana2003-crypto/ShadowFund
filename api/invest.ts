import type { NextApiRequest, NextApiResponse } from "../types/api.js";
import { verifySignature } from "../utils/verifySignature.js";
import { loadTreasury } from "../lib/treasury.js";
import { getVaultAddress } from "../lib/vaults.js";
import { moveUSD1, getUSD1Fees } from "../lib/usd1.js";
import { executeYieldStrategy, executeGrowthStrategy, executeDegenStrategy, getVaultStats, getAllTransactions } from "../lib/strategies/index.js";
import { applyCors } from "../lib/cors.js";
import { logger } from "../lib/logger.js";
import { getRuntimeMode, withRuntimeMode } from "../lib/runtimeMode.js";

type VaultId = "reserve" | "yield" | "growth" | "degen";
type AllocationInput = Partial<Record<VaultId, number>>;

const INVESTABLE_VAULTS: VaultId[] = ["yield", "growth", "degen"];

function log(step: string, message: string) {
    logger.info(message, "INVEST", { step });
}

function parseAllocations(
    body: any
): { allocations: Record<VaultId, number>; selected: VaultId[] } | { error: string } {
    const rawAlloc = body?.allocations ?? {};
    const rawSelected = Array.isArray(body?.selectedVaults)
        ? (body.selectedVaults as string[])
        : [];

    let selected: VaultId[] = [];
    let allocMap: Record<VaultId, number> = {
        reserve: 0,
        yield: 0,
        growth: 0,
        degen: 0
    };

    if (rawSelected.length > 0) {
        selected = rawSelected
            .map(v => String(v).toLowerCase())
            .filter(v => INVESTABLE_VAULTS.includes(v as VaultId)) as VaultId[];
    }

    for (const vault of INVESTABLE_VAULTS) {
        const value = rawAlloc?.[vault];
        const parsed = typeof value === "number" ? value : Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            allocMap[vault] = parsed;
            if (!selected.includes(vault)) {
                selected.push(vault);
            }
        }
    }

    if (selected.length === 0) {
        return { error: "Select at least one vault" };
    }

    const totalPct = selected.reduce((sum, v) => sum + (allocMap[v] || 0), 0);
    if (totalPct <= 0) {
        // Default to equal split if only selected vaults were provided
        const equal = 100 / selected.length;
        for (const v of selected) {
            allocMap[v] = equal;
        }
        return { allocations: allocMap, selected };
    }

    // Normalize to 100
    for (const v of selected) {
        allocMap[v] = (allocMap[v] / totalPct) * 100;
    }

    return { allocations: allocMap, selected };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    applyCors(req, res, ["POST", "OPTIONS"]);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    return withRuntimeMode(req, async () => {
        const startTime = Date.now();

        try {
            log("START", "Manual invest started");

            const { wallet, amount, risk, timestamp, signature, action } = req.body;

            if (!wallet) {
                return res.status(400).json({ error: "wallet required" });
            }

            const investAmount = Number(amount);
            if (!Number.isFinite(investAmount) || investAmount <= 0) {
                return res.status(400).json({ error: "amount must be > 0" });
            }

            // Verify wallet signature for secure operations
            if (signature && timestamp && action) {
                const message = `${action}|${wallet}|${timestamp}`;
                const now = Date.now();

                if (Math.abs(now - Number(timestamp)) > 60_000) {
                    return res.status(401).json({ error: "Signature expired" });
                }

                if (!verifySignature(message, signature, wallet)) {
                    return res.status(401).json({ error: "Invalid signature" });
                }
            }

            const allocResult = parseAllocations(req.body);
            if ("error" in allocResult) {
                return res.status(400).json({ error: allocResult.error });
            }

            const { allocations, selected } = allocResult;
            const runtimeMode = getRuntimeMode();
            const envMin = Number(process.env.SHADOWWIRE_MIN_INTERNAL_TRANSFER_USD1);
            const realInternalMin =
                Number.isFinite(envMin) && envMin > 0 ? envMin : 5;
            const feeInfo = getUSD1Fees();
            const internalMin = runtimeMode === "real" ? realInternalMin : feeInfo.minimumAmount;

            log("STEP 1", "Loading treasury");
            const treasury = await loadTreasury(wallet, risk || "medium");

            if (investAmount > treasury.totalUSD1) {
                return res.status(400).json({
                    error: `Insufficient shielded balance. Available: ${treasury.totalUSD1.toFixed(2)} USD1`
                });
            }

            const perVaultAmounts: Record<VaultId, number> = {
                reserve: 0,
                yield: 0,
                growth: 0,
                degen: 0
            };

            for (const v of selected) {
                const pct = allocations[v] || 0;
                perVaultAmounts[v] = (pct / 100) * investAmount;
            }

            if (runtimeMode === "real") {
                const tooSmall = selected.find(v => perVaultAmounts[v] > 0 && perVaultAmounts[v] < internalMin);
                if (tooSmall) {
                    return res.status(400).json({
                        error: `Each selected vault must be at least ${internalMin} USD1 in real mode`
                    });
                }
            }

            const reserveVault = await getVaultAddress(wallet, "reserve");
            const reserveBalance = treasury.vaults.find(v => v.id === "reserve")?.balance || 0;
            let availableWallet = treasury.walletBalance;
            let availableReserve = reserveBalance;

            const usd1Transfers: Array<{ vault: string; direction: "in"; amount: number; txHash?: string }> = [];
            const usd1Errors: Array<{ vault: string; error: string }> = [];

            for (const vaultId of selected) {
                const amountForVault = perVaultAmounts[vaultId];
                if (amountForVault <= 0) continue;

                let from: string | null = null;
                if (availableWallet >= amountForVault) {
                    from = wallet;
                    availableWallet -= amountForVault;
                } else if (availableReserve >= amountForVault) {
                    from = reserveVault;
                    availableReserve -= amountForVault;
                }

                if (!from) {
                    usd1Errors.push({
                        vault: vaultId,
                        error: "Insufficient shielded balance in a single source (wallet or reserve)"
                    });
                    continue;
                }

                const vaultPda = await getVaultAddress(wallet, vaultId);
                const result = await moveUSD1(from, vaultPda, amountForVault);

                if (!result.success) {
                    usd1Errors.push({
                        vault: vaultId,
                        error: result.error || "Transfer failed"
                    });
                    continue;
                }

                usd1Transfers.push({
                    vault: vaultId,
                    direction: "in",
                    amount: amountForVault,
                    txHash: result.txHash
                });
            }

            log("STEP 2", "USD1 transfers complete");

            const strategyResults: Record<string, any> = {};
            const strategyErrors: string[] = [];
            const unsignedTxs: string[] = [];

            const vaultBalanceMap = new Map(
                treasury.vaults.map(v => [v.id, v.balance])
            );

            for (const vaultId of selected) {
                const amountForVault = perVaultAmounts[vaultId] || 0;
                if (amountForVault <= 0) continue;
                if (!usd1Transfers.find(t => t.vault === vaultId)) continue;

                const currentValue = vaultBalanceMap.get(vaultId) || 0;
                const targetAmount = currentValue + amountForVault;

                try {
                    if (vaultId === "yield") {
                        strategyResults.yield = await executeYieldStrategy(wallet, targetAmount, "low");
                        if (strategyResults.yield?.unsignedTxs) {
                            unsignedTxs.push(...strategyResults.yield.unsignedTxs);
                        }
                    } else if (vaultId === "growth") {
                        strategyResults.growth = await executeGrowthStrategy(wallet, targetAmount);
                        if (strategyResults.growth?.unsignedTxs) {
                            unsignedTxs.push(...strategyResults.growth.unsignedTxs);
                        }
                    } else if (vaultId === "degen") {
                        strategyResults.degen = await executeDegenStrategy(wallet, targetAmount, "medium");
                        if (strategyResults.degen?.unsignedTxs) {
                            unsignedTxs.push(...strategyResults.degen.unsignedTxs);
                        }
                    }
                } catch (error) {
                    strategyErrors.push(
                        `${vaultId}: ${error instanceof Error ? error.message : "Unknown error"}`
                    );
                }
            }

            log("STEP 3", "Strategies executed");

            const vaultStats = await getVaultStats(wallet);
            const allTransactions = getAllTransactions(strategyResults);

            return res.status(200).json({
                ok: usd1Errors.length === 0,
                message: "Manual investment executed",
                allocation: {
                    reserve: treasury.totalUSD1 > 0
                        ? Math.max(0, ((treasury.totalUSD1 - investAmount) / treasury.totalUSD1) * 100)
                        : 0,
                    yield: treasury.totalUSD1 > 0 ? (perVaultAmounts.yield / treasury.totalUSD1) * 100 : 0,
                    growth: treasury.totalUSD1 > 0 ? (perVaultAmounts.growth / treasury.totalUSD1) * 100 : 0,
                    degen: treasury.totalUSD1 > 0 ? (perVaultAmounts.degen / treasury.totalUSD1) * 100 : 0
                },
                execution: {
                    investAmount,
                    perVaultAmounts,
                    usd1Transfers,
                    usd1Errors: usd1Errors.length > 0 ? usd1Errors : undefined,
                    unsignedTxs,
                    strategyResults,
                    totalTransactions: allTransactions.length
                },
                vaultStats,
                errors: strategyErrors.length > 0 ? strategyErrors : undefined,
                duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
            });
        } catch (error) {
            logger.error("Manual invest failed", "INVEST", {
                message: error instanceof Error ? error.message : String(error)
            });
            return res.status(500).json({ error: "Manual invest failed" });
        }
    });
}
