#!/usr/bin/env ts-node

/**
 * Generate a new Solana wallet for testing
 * 
 * Usage:
 *   npx ts-node scripts/generate-wallet.ts
 * 
 * This will generate a new keypair and output:
 * - Public key (address)
 * - Private key in base64 (for SERVER_WALLET_SECRET)
 * - Private key in bs58 (for Phantom/Solflare import)
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

console.log('\n' + '='.repeat(70));
console.log('🔑  SOLANA WALLET GENERATOR');
console.log('='.repeat(70) + '\n');

const keypair = Keypair.generate();

console.log('📍 Public Key (Wallet Address):');
console.log('   ' + keypair.publicKey.toBase58());
console.log('');

console.log('🔐 Private Key (Base64 - for .env.local):');
console.log('   SERVER_WALLET_SECRET=' + Buffer.from(keypair.secretKey).toString('base64'));
console.log('');

console.log('🔐 Private Key (Base58 - for Phantom/Solflare):');
console.log('   ' + bs58.encode(keypair.secretKey));
console.log('');

console.log('⚠️  SECURITY WARNINGS:');
console.log('   1. NEVER commit private keys to git!');
console.log('   2. Store in .env.local (already in .gitignore)');
console.log('   3. For production, use AWS KMS or similar');
console.log('   4. This wallet needs SOL for transaction fees');
console.log('');

console.log('📝 Next Steps:');
console.log('   1. Copy the SERVER_WALLET_SECRET line to backend/.env.local');
console.log('   2. For devnet testing:');
console.log('      solana airdrop 2 ' + keypair.publicKey.toBase58() + ' --url devnet');
console.log('   3. For mainnet, send SOL to: ' + keypair.publicKey.toBase58());
console.log('');

console.log('='.repeat(70) + '\n');
