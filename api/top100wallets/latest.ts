/**
 * Top 100 Wallets API - Latest snapshot endpoint
 * GET /api/top100wallets/latest - Returns latest cached snapshot
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SnapshotMeta {
  timestamp: string;
  source: string;
  isLive: boolean;
  walletCount: number;
  topHolderBalance: number;
  top10TotalBalance: number;
  top100TotalBalance: number;
  top100PercentageOfSupply: number;
}

const snapshots: SnapshotMeta[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const response = await fetch(`${baseUrl}/api/top100wallets`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wallets: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.wallets) {
      throw new Error('Invalid response from main endpoint');
    }

    const wallets = data.data.wallets;
    const circulatingSupply = data.data.meta.circulatingSupply || 8396155970;

    const top10Total = wallets.slice(0, 10).reduce((sum: number, w: any) => sum + w.totalBalance, 0);
    const top100Total = wallets.reduce((sum: number, w: any) => sum + w.totalBalance, 0);

    const snapshotMeta: SnapshotMeta = {
      timestamp: data.data.meta.timestamp,
      source: data.data.meta.source,
      isLive: data.data.meta.isLive,
      walletCount: wallets.length,
      topHolderBalance: wallets[0]?.totalBalance || 0,
      top10TotalBalance: top10Total,
      top100TotalBalance: top100Total,
      top100PercentageOfSupply: parseFloat(((top100Total / circulatingSupply) * 100).toFixed(2)),
    };

    return res.status(200).json({
      success: true,
      data: {
        latest: snapshotMeta,
        summary: {
          largestHolder: {
            address: wallets[0]?.address || 'Unknown',
            balance: wallets[0]?.totalBalance || 0,
            percentage: wallets[0]?.percentageOfSupply || 0,
          },
          distribution: {
            whales: wallets.filter((w: any) => w.status === 'whale').length,
            sharks: wallets.filter((w: any) => w.status === 'shark').length,
            dolphins: wallets.filter((w: any) => w.status === 'dolphin').length,
            tunas: wallets.filter((w: any) => w.status === 'tuna').length,
            fish: wallets.filter((w: any) => w.status === 'fish').length,
          },
          concentrationMetrics: {
            top10Percentage: parseFloat(((top10Total / circulatingSupply) * 100).toFixed(2)),
            top22Percentage: parseFloat(((wallets.slice(0, 22).reduce((sum: number, w: any) => sum + w.totalBalance, 0) / circulatingSupply) * 100).toFixed(2)),
            top100Percentage: snapshotMeta.top100PercentageOfSupply,
          },
        },
        meta: data.data.meta,
      },
    });
  } catch (error) {
    console.error('Latest snapshot API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch latest snapshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
