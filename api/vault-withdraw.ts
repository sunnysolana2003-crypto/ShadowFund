/**
 * Vault Withdraw API
 * POST /api/vault-withdraw
 * 
 * Withdraws funds from a specific vault back to the shielded USD1 pool.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { strategies } from '../lib/strategies';
import { shadowwire } from '../lib/shadowwire';
import { logger } from '../lib/logger';

const log = (msg: string) => logger.info(msg, 'API:VaultWithdraw');

interface VaultWithdrawRequest {
    wallet: string;
    vault: 'reserve' | 'yield' | 'growth' | 'degen';
    amount: number;
    timestamp?: number;
    signature?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { wallet, vault, amount } = req.body as VaultWithdrawRequest;

        if (!wallet || !vault || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                error: 'Missing required fields: wallet, vault, amount'
            });
        }

        if (!['reserve', 'yield', 'growth', 'degen'].includes(vault)) {
            return res.status(400).json({
                error: 'Invalid vault. Must be: reserve, yield, growth, or degen'
            });
        }

        log(`Vault withdrawal request: ${vault}`);

        const strategy = strategies[vault];
        if (!strategy) {
            return res.status(400).json({ error: `Strategy not found for vault: ${vault}` });
        }

        // Get current vault value
        const currentValue = await strategy.getValue(wallet);
        if (amount > currentValue) {
            return res.status(400).json({
                error: `Insufficient balance. Available: $${currentValue.toFixed(2)}`
            });
        }

        // Execute withdrawal from the vault
        const result = await strategy.withdraw(wallet, amount);

        if (!result.success) {
            return res.status(400).json({
                error: result.error || 'Withdrawal failed'
            });
        }

        // For non-reserve vaults, tokens are swapped to USD1
        // The USD1 is now back in the shielded pool
        let usd1Received = amount;
        
        // Growth/Degen return actual USD1 received from swaps
        if ('totalUSD1' in result && result.totalUSD1) {
            usd1Received = result.totalUSD1;
        }

        log(`Vault withdrawal complete`);

        return res.status(200).json({
            ok: true,
            vault,
            amountRequested: amount,
            usd1Received,
            txSignature: result.txSignature,
            unsigned_txs: (result as any).unsigned_txs,
            message: `Withdrew from ${vault} vault → ${usd1Received.toFixed(2)} USD1 returned to shielded pool`
        });

    } catch (error) {
        logger.error('Vault withdrawal failed', 'API:VaultWithdraw');
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}
