#!/usr/bin/env node

/**
 * Test USD1 Balance Detection Script
 * This script tests the USD1 balance detection on mainnet
 */

const { Connection, PublicKey } = require('@solana/web3.js');

const MAINNET_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const USD1_MINT = 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB';

async function testUSD1Balance(walletAddress) {
    console.log('\n=== USD1 Balance Detection Test ===\n');
    console.log(`Network: Mainnet Beta`);
    console.log(`RPC: ${MAINNET_RPC}`);
    console.log(`USD1 Mint: ${USD1_MINT}`);
    console.log(`Wallet: ${walletAddress}\n`);

    try {
        const connection = new Connection(MAINNET_RPC, 'confirmed');

        // Test 1: Check connection
        console.log('✓ Connection established');

        // Test 2: Check if wallet is valid
        const pubkey = new PublicKey(walletAddress);
        console.log('✓ Wallet address is valid');

        // Test 3: Get SOL balance
        const solBalance = await connection.getBalance(pubkey);
        console.log(`✓ SOL Balance: ${(solBalance / 1e9).toFixed(4)} SOL`);

        // Test 4: Check for USD1 token accounts
        const mint = new PublicKey(USD1_MINT);
        const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
            mint: mint
        });

        console.log(`\nUSD1 Token Accounts Found: ${accounts.value.length}`);

        if (accounts.value.length === 0) {
            console.log('\n⚠️  No USD1 token account found');
            console.log('\nPossible reasons:');
            console.log('  1. No USD1 tokens in this wallet');
            console.log('  2. Need to create a USD1 token account first');
            console.log('\nTo get USD1:');
            console.log('  - Swap on Jupiter: https://jup.ag/swap/USDC-USD1');
            console.log('  - Or transfer from another wallet');
        } else {
            accounts.value.forEach((account, idx) => {
                const info = account.account.data.parsed.info;
                const balance = info.tokenAmount.uiAmount;
                console.log(`\n✓ Token Account #${idx + 1}:`);
                console.log(`  Address: ${account.pubkey.toBase58()}`);
                console.log(`  Balance: ${balance} USD1`);
                console.log(`  Raw Amount: ${info.tokenAmount.amount}`);
                console.log(`  Decimals: ${info.tokenAmount.decimals}`);
            });
        }

        console.log('\n=== Test Complete ===\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nStack:', error.stack);
    }
}

// Get wallet from command line or use default
const walletAddress = process.argv[2];

if (!walletAddress) {
    console.error('Usage: node test-usd1-balance.js <WALLET_ADDRESS>');
    process.exit(1);
}

testUSD1Balance(walletAddress);
