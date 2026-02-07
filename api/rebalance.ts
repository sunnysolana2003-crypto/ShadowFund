import type { NextApiRequest, NextApiResponse } from "../types/api.js";
import { verifySignature } from "../utils/verifySignature.js";
import { loadTreasury } from "../lib/treasury.js";
import { getVaultAddress } from "../lib/vaults.js";
import { moveUSD1, getUSD1Fees } from "../lib/usd1.js";
import { deposit, withdraw } from "../lib/shadowwire.js";
import { getAIStrategy } from "../lib/ai/index.js";
import { executeAllStrategies, getVaultStats, getAllTransactions } from "../lib/strategies/index.js";
import { applyCors } from "../lib/cors.js";
import { logger } from "../lib/logger.js";
import { getRuntimeMode, withRuntimeMode } from "../lib/runtimeMode.js";

function log(step: string, message: string) {
    logger.info(message, "REBALANCE", { step });
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
            log("START", "Rebalance started");

            const { wallet, risk, timestamp, signature, action } = req.body;

            if (!wallet) {
                log("ERROR", "Wallet missing");
                return res.status(400).json({ error: "wallet required" });
            }

            // Verify wallet signature for secure operations
            if (signature && timestamp && action) {
                const message = `${action}|${wallet}|${timestamp}`;
                const now = Date.now();

                if (Math.abs(now - Number(timestamp)) > 60_000) {
                    log("ERROR", "Signature expired");
                    return res.status(401).json({ error: "Signature expired" });
                }

                if (!verifySignature(message, signature, wallet)) {
                    log("ERROR", "Invalid signature");
                    return res.status(401).json({ error: "Invalid signature" });
                }
            }

            const riskLevel = risk || "medium";
            const runtimeMode = getRuntimeMode();
            const envMin = Number(process.env.SHADOWWIRE_MIN_INTERNAL_TRANSFER_USD1);
            const realInternalMin =
                Number.isFinite(envMin) && envMin > 0 ? envMin : 5;

            log("STEP 3", "Loading treasury state");
            const treasury = await loadTreasury(wallet, riskLevel);

            let activeTotal = treasury.totalUSD1;

            if (treasury.publicBalance > 0 && activeTotal < 1) {
                try {
                    await deposit(wallet, treasury.publicBalance);
                    log("STEP 3.1", "Bridge completed");
                    activeTotal += treasury.publicBalance;

                    // Refresh treasury after bridge
                    const updatedTreasury = await loadTreasury(wallet, riskLevel);
                    treasury.totalUSD1 = updatedTreasury.totalUSD1;
                    treasury.vaults = updatedTreasury.vaults;
                } catch {
                    log("ERROR", "Bridge failed");
                }
            }

            log("STEP 3", "Treasury loaded");

            // 2) Run multi-layer AI engine to get target allocation
            log("STEP 4", "Calling AI strategy");
            const strategyResult = await getAIStrategy(riskLevel);
            const { signals, mood } = strategyResult;
            let { allocation } = strategyResult;

            // ShadowWire internal transfers have a minimum size on mainnet (anti-spam).
            // For small portfolios, adjust allocation so we don't target impossible (< min) vault moves.
            if (runtimeMode === "real" && treasury.totalUSD1 > 0) {
                const adjusted = { ...allocation };
                const vaultIds = ["yield", "growth", "degen"] as const;
                let shifted = 0;

                for (const id of vaultIds) {
                    const target = (adjusted[id] / 100) * treasury.totalUSD1;
                    if (target > 0 && target < realInternalMin) {
                        shifted += adjusted[id];
                        adjusted[id] = 0;
                    }
                }

                adjusted.reserve = Math.min(100, adjusted.reserve + shifted);
                const sum = adjusted.reserve + adjusted.yield + adjusted.growth + adjusted.degen;
                if (sum !== 100) {
                    adjusted.reserve += 100 - sum;
                }

                allocation = adjusted;
            }

            log("STEP 4", "Target allocation set");

            // 3) First, move USD1 between ShadowWire vaults (use PDAs, not display names)
            log("STEP 5", "Moving USD1 between vaults");
            const reserveVault = await getVaultAddress(wallet, "reserve");
            const transfers = [];
            const usd1Errors = [];
            const usd1Skipped: Array<{ vault: string; reason: string }> = [];
            const feeInfo = getUSD1Fees();
            const internalMin = runtimeMode === "real" ? realInternalMin : feeInfo.minimumAmount;

            for (const vault of treasury.vaults) {
                if (vault.id === "reserve") {
                    continue;
                }
                const targetPercent = allocation[vault.id as keyof typeof allocation];
                const currentPercent = treasury.totalUSD1 > 0 ? (vault.balance / treasury.totalUSD1) * 100 : 0;
                const target = (targetPercent / 100) * treasury.totalUSD1;
                const diff = target - vault.balance;

                const absDiff = Math.abs(diff);
                if (absDiff < internalMin) {
                    // Skip dust allocations that ShadowWire would reject (anti-spam minimum).
                    // We keep the funds in the reserve vault until the portfolio is large enough.
                    if (absDiff > 0) {
                        usd1Skipped.push({
                            vault: vault.id,
                            reason: `below_minimum_${internalMin.toFixed(2)}`
                        });
                    }
                    continue;
                }

                if (absDiff > feeInfo.minimumAmount) {
                    // Use vault PDA addresses for ShadowWire (real pubkeys required)
                    const vaultPda = await getVaultAddress(wallet, vault.id as "reserve" | "yield" | "growth" | "degen");
                    let from = diff > 0 ? reserveVault : vaultPda;
                    let to = diff > 0 ? vaultPda : reserveVault;
                    const direction = diff > 0 ? "in" : "out";

                    // SPECIAL LOGIC: If funding needs to happen (diff > 0) and Reserve is empty but Wallet has funds, use Wallet as source
                    // This handles the "Initial Deposit" scenario where funds sit in Wallet before allocation
                    if (diff > 0 && treasury.walletBalance > 0) {
                        from = wallet;
                    }

                    if (from === to) {
                        continue;
                    }

                    let result;
                    try {
                        result = await moveUSD1(from, to, absDiff);

                        if (!result.success) {
                            const errMsg = result.error || 'Transfer failed';
                            const lower = errMsg.toLowerCase();
                            const isMinimum =
                                lower.includes("below minimum") ||
                                lower.includes("anti-spam") ||
                                lower.includes("minimum");

                            if (isMinimum) {
                                usd1Skipped.push({
                                    vault: vault.id,
                                    reason: "shadowwire_minimum"
                                });
                                continue;
                            }

                            usd1Errors.push({ vault: vault.id, error: errMsg });
                            continue;
                        }
                    } catch (moveError: any) {
                        if (runtimeMode === "demo") {
                            log("STEP 5", "Transfer simulation fallback");
                            result = {
                                success: true,
                                txHash: `sim_${vault.id}_${Date.now()}`,
                                demo: true,
                            };
                        } else {
                            usd1Errors.push({
                                vault: vault.id,
                                error: moveError instanceof Error ? moveError.message : String(moveError)
                            });
                            continue;
                        }
                    }

                    if (result.success) {
                        transfers.push({
                            vault: vault.id,
                            direction,
                            amount: Math.abs(diff),
                            txHash: result.txHash
                        });
                    } else {
                        usd1Errors.push({ vault: vault.id, error: result.error });
                    }
                }
            }

            log("STEP 5", "USD1 transfers complete");

            // 4) Execute actual vault strategies (Yield farming, Growth swaps, Degen trading)
            log("STEP 6", "Executing vault strategies");

            const strategyExecution = await executeAllStrategies(
                wallet,
                treasury.totalUSD1,
                allocation,
                { memeHype: signals.memeHype }
            );

            // Collect all transaction signatures
            const allTransactions = getAllTransactions(strategyExecution.results);
            const unsignedTxs = Object.values(strategyExecution.results)
                .flatMap(result => result?.unsignedTxs || []);

            log("STEP 7", "Fetching vault statistics");
            const vaultStats = await getVaultStats(wallet);

            log("COMPLETE", "Rebalance complete");

            // Build detailed response
            const response = {
                ok: true,
                message: "USD1 rebalanced with REAL vault strategies executed",
                strategy: {
                    signals,
                    mood,
                    allocation,
                    aiPowered: (strategyResult as any).aiPowered,
                    reasoning: (strategyResult as any).reasoning,
                    confidence: (strategyResult as any).confidence
                },
                execution: {
                    usd1Transfers: transfers,
                    usd1Skipped,
                    usd1Errors: usd1Errors.length > 0 ? usd1Errors : undefined,
                    unsignedTxs,
                    strategyResults: {
                        reserve: {
                            success: strategyExecution.results.reserve?.success,
                            transactions: strategyExecution.results.reserve?.txSignatures?.length || 0
                        },
                        yield: {
                            success: strategyExecution.results.yield?.success,
                            apy: vaultStats.yield.apy,
                            earned: vaultStats.yield.earned,
                            transactions: strategyExecution.results.yield?.txSignatures?.length || 0
                        },
                        growth: {
                            success: strategyExecution.results.growth?.success,
                            positions: vaultStats.growth.positions?.length || 0,
                            pnl: vaultStats.growth.pnl,
                            transactions: strategyExecution.results.growth?.txSignatures?.length || 0
                        },
                        degen: {
                            success: strategyExecution.results.degen?.success,
                            positions: vaultStats.degen.positions?.length || 0,
                            pnl: vaultStats.degen.pnl,
                            transactions: strategyExecution.results.degen?.txSignatures?.length || 0
                        }
                    },
                    totalTransactions: allTransactions.length
                },
                vaultStats: {
                    reserve: {
                        balance: vaultStats.reserve.balance,
                        percentage: vaultStats.reserve.percentage
                    },
                    yield: {
                        balance: vaultStats.yield.balance,
                        percentage: vaultStats.yield.percentage,
                        apy: vaultStats.yield.apy,
                        earnedYield: vaultStats.yield.earned
                    },
                    growth: {
                        balance: vaultStats.growth.balance,
                        percentage: vaultStats.growth.percentage,
                        positions: vaultStats.growth.positions,
                        pnl: vaultStats.growth.pnl
                    },
                    degen: {
                        balance: vaultStats.degen.balance,
                        percentage: vaultStats.degen.percentage,
                        positions: vaultStats.degen.positions,
                        pnl: vaultStats.degen.pnl
                    },
                    total: vaultStats.total
                },
                errors: strategyExecution.errors.length > 0 ? strategyExecution.errors : undefined,
                fees: {
                    percentage: feeInfo.feePercentage,
                    minimum: feeInfo.minimumAmount
                },
                duration: `${Date.now() - startTime}ms`
            };

            res.json(response);
        } catch (err) {
            logger.error("Rebalance failed", "REBALANCE");
            res.status(500).json({ error: "Rebalance failed" });
        }
    });
}
