/**
 * useReferral Hook
 * Manages referral tracking, stats, and points claiming
 */

import { useState, useCallback, useEffect } from 'react';

export interface ReferralStats {
  confirmedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  claimablePoints: number;
  pointsBalance: number;
  referralCode: string;
  referralLink: string;
}

export interface UseReferralReturn {
  stats: ReferralStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (walletAddress: string) => Promise<void>;
  trackReferral: (walletAddress: string, referralCode: string) => Promise<boolean>;
  confirmReferral: (walletAddress: string) => Promise<boolean>;
  claimPoints: (walletAddress: string) => Promise<boolean>;
  getReferralCode: (walletAddress: string) => Promise<string | null>;
}

const API_BASE = '/api/referral';

export function useReferral(): UseReferralReturn {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to safely parse JSON responses
   */
  const parseJsonResponse = useCallback(async (response: Response): Promise<any> => {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ [useReferral] Invalid content type:', contentType);
      console.error('❌ [useReferral] Response text:', text.substring(0, 200));
      throw new Error(`Expected JSON but got ${contentType || 'unknown'}`);
    }
    
    return response.json();
  }, []);

  /**
   * Fetch referral stats for a user
   */
  const fetchStats = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}?action=stats&walletAddress=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await parseJsonResponse(response);

      if (data.success && data.data) {
        console.log('✅ [useReferral] Stats fetched:', data.data);
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to fetch referral stats');
        console.warn('⚠️ [useReferral] API returned non-success response:', data);
      }
    } catch (err: any) {
      console.error('[useReferral] Error fetching stats:', err);
      setError(err.message || 'Error fetching referral stats');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Track a new referral when user signs up
   */
  const trackReferral = useCallback(
    async (walletAddress: string, referralCode: string): Promise<boolean> => {
      if (!walletAddress || !referralCode) {
        setError('wallet address and referral code are required');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'track', walletAddress, referralCode }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await parseJsonResponse(response);

        if (data.success) {
          // Refresh stats after tracking
          await fetchStats(walletAddress);
          return true;
        } else {
          setError(data.error || 'Failed to track referral');
          return false;
        }
      } catch (err: any) {
        console.error('[useReferral] Error tracking referral:', err);
        setError(err.message || 'Error tracking referral');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats, parseJsonResponse]
  );

  /**
   * Confirm a referral after wallet analysis
   */
  const confirmReferral = useCallback(
    async (walletAddress: string): Promise<boolean> => {
      if (!walletAddress) {
        setError('wallet address is required');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm', walletAddress }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await parseJsonResponse(response);

        if (data.success) {
          // Refresh stats after confirmation
          await fetchStats(walletAddress);
          return true;
        } else {
          setError(data.error || 'Failed to confirm referral');
          return false;
        }
      } catch (err: any) {
        console.error('[useReferral] Error confirming referral:', err);
        setError(err.message || 'Error confirming referral');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats, parseJsonResponse]
  );

  /**
   * Claim referral points
   */
  const claimPoints = useCallback(
    async (walletAddress: string): Promise<boolean> => {
      if (!walletAddress) {
        setError('wallet address is required');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/claim-points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await parseJsonResponse(response);

        if (data.success) {
          // Refresh stats after claiming
          await fetchStats(walletAddress);
          return true;
        } else {
          setError(data.error || 'Failed to claim points');
          return false;
        }
      } catch (err: any) {
        console.error('[useReferral] Error claiming points:', err);
        setError(err.message || 'Error claiming points');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats]
  );

  /**
   * Get or generate referral code for a user
   */
  const getReferralCode = useCallback(async (walletAddress: string): Promise<string | null> => {
    if (!walletAddress) return null;

    try {
      const response = await fetch(`${API_BASE}/code?walletAddress=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await parseJsonResponse(response);

      if (data.success && data.data) {
        return data.data.referralCode;
      }
      return null;
    } catch (err: any) {
      console.error('[useReferral] Error getting referral code:', err);
      return null;
    }
  }, [parseJsonResponse]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    trackReferral,
    confirmReferral,
    claimPoints,
    getReferralCode,
  };
}
