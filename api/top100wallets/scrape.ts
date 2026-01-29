/**
 * Top 100 Wallets API - PiScan scraper endpoint
 * GET /api/top100wallets/scrape - Fetches data from PiScan
 * 
 * This endpoint attempts to scrape/fetch rich list data from PiScan
 * and returns normalized wallet data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ScrapedWallet {
  address: string;
  balance: number;
  available: number;
  locked: number;
  staking: number;
  percentageOfSupply: number;
  lastActivity?: string;
  change7d?: number;
}

const PISCAN_ENDPOINTS = [
  'https://piscan.io/api/v1/richlist',
  'https://piscan.io/api/richlist',
  'https://api.piscan.io/v1/accounts/top',
];

const PI_BLOCK_EXPLORER_ENDPOINTS = [
  'https://blockexplorer.minepi.com/api/accounts',
  'https://api.mainnet.minepi.com/accounts',
];

async function tryFetchWithTimeout(url: string, timeout: number = 8000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url + '?limit=100&sort=balance&order=desc', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ReputaScore/2.5.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return response;
    }

    console.log(`Endpoint ${url} returned status ${response.status}`);
    return null;
  } catch (error) {
    console.log(`Endpoint ${url} failed:`, error);
    return null;
  }
}

async function fetchFromPiScan(): Promise<ScrapedWallet[] | null> {
  for (const endpoint of PISCAN_ENDPOINTS) {
    const response = await tryFetchWithTimeout(endpoint);
    if (response) {
      try {
        const data = await response.json();
        
        const wallets = data.data || data.accounts || data.richlist || data;
        
        if (Array.isArray(wallets) && wallets.length > 0) {
          return wallets.slice(0, 100).map((item: any) => ({
            address: item.account || item.address || item.wallet_address,
            balance: parseFloat(item.balance || item.total_balance || '0'),
            available: parseFloat(item.available || item.unlocked || item.free_balance || '0'),
            locked: parseFloat(item.locked || item.locked_balance || '0'),
            staking: parseFloat(item.staking || item.staking_balance || '0'),
            percentageOfSupply: parseFloat(item.percentage || item.share || '0'),
            lastActivity: item.last_activity || item.last_transaction_at,
            change7d: parseFloat(item.change_7d || '0') || undefined,
          }));
        }
      } catch (e) {
        console.log(`Failed to parse response from ${endpoint}:`, e);
      }
    }
  }

  return null;
}

async function fetchFromBlockExplorer(): Promise<ScrapedWallet[] | null> {
  for (const endpoint of PI_BLOCK_EXPLORER_ENDPOINTS) {
    const response = await tryFetchWithTimeout(endpoint);
    if (response) {
      try {
        const data = await response.json();
        
        const accounts = data._embedded?.records || data.accounts || data;
        
        if (Array.isArray(accounts) && accounts.length > 0) {
          const circulatingSupply = 8396155970;
          
          return accounts.slice(0, 100).map((item: any) => {
            const balance = parseFloat(item.balances?.[0]?.balance || item.balance || '0') / 10000000;
            
            return {
              address: item.account_id || item.id || item.address,
              balance,
              available: balance,
              locked: 0,
              staking: 0,
              percentageOfSupply: (balance / circulatingSupply) * 100,
              lastActivity: item.last_modified_time,
            };
          });
        }
      } catch (e) {
        console.log(`Failed to parse block explorer response:`, e);
      }
    }
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[SCRAPE] Attempting to fetch from PiScan...');
    let wallets = await fetchFromPiScan();
    let source = 'piscan';

    if (!wallets) {
      console.log('[SCRAPE] PiScan failed, trying Block Explorer...');
      wallets = await fetchFromBlockExplorer();
      source = 'blockexplorer';
    }

    if (!wallets) {
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch data from blockchain explorers',
        message: 'All data sources are currently unavailable. Please try again later.',
        triedEndpoints: [...PISCAN_ENDPOINTS, ...PI_BLOCK_EXPLORER_ENDPOINTS],
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        wallets,
        source,
        timestamp: new Date().toISOString(),
        count: wallets.length,
      },
    });
  } catch (error) {
    console.error('[SCRAPE] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
