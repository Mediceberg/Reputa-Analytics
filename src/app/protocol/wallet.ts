/**
 * Wallet Module - Fetch wallet data and username
 */

import type { WalletData, Transaction } from './types';

/**
 * Fetch wallet data including username and last 10 transactions
 */
export async function fetchWalletData(walletAddress: string): Promise<WalletData> {
  // In production, this would call Pi Network API
  // For now, generate deterministic mock data
  
  const seed = hashAddress(walletAddress);
  const accountAge = Math.floor(seed % 730) + 30; // 30-730 days
  const createdAt = new Date(Date.now() - accountAge * 24 * 60 * 60 * 1000);
  
  const transactions = generateTransactions(walletAddress, 10, seed);
  
  return {
    address: walletAddress,
    username: await fetchUsername(walletAddress),
    balance: (seed % 10000) / 100,
    accountAge,
    createdAt,
    transactions,
    totalTransactions: Math.floor(seed % 500) + 10
  };
}

/**
 * Fetch username from Pi Network (mock implementation)
 */
export async function fetchUsername(walletAddress: string): Promise<string> {
  // In production: await fetch('https://api.minepi.com/v2/me', ...)
  const seed = hashAddress(walletAddress);
  const names = ['Pioneer', 'Miner', 'Builder', 'Innovator', 'Creator'];
  return `${names[seed % names.length]}${seed % 10000}`;
}

/**
 * Generate mock transactions (in production, fetch from blockchain)
 */
function generateTransactions(
  walletAddress: string,
  count: number,
  seed: number
): Transaction[] {
  const transactions: Transaction[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const txSeed = seed + i * 1000;
    const isReceived = txSeed % 2 === 0;
    const isInternal = txSeed % 10 < 7; // 70% internal, 30% external
    const amount = ((txSeed % 10000) / 100) + 0.01;
    const daysAgo = i * (txSeed % 5 + 1);
    
    transactions.push({
      id: `tx_${txSeed.toString(36)}`,
      timestamp: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      amount: parseFloat(amount.toFixed(2)),
      from: isReceived ? generateAddress(txSeed + 1) : walletAddress,
      to: isReceived ? walletAddress : generateAddress(txSeed + 2),
      type: isInternal ? 'internal' : 'external',
      memo: isInternal ? 'Pi App Transfer' : 'Exchange Withdrawal'
    });
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Generate random wallet address
 */
function generateAddress(seed: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let address = 'G';
  for (let i = 0; i < 55; i++) {
    address += chars[Math.abs(seed * (i + 1)) % chars.length];
  }
  return address;
}

/**
 * Simple hash function for deterministic mock data
 */
function hashAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
