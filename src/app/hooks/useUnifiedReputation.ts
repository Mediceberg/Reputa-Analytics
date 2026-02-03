/**
 * Unified Reputation Hook
 * Provides consistent access to reputation data and methods across the app
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedReputationService, UserReputationState } from '../services/unifiedReputationService';

export function useUnifiedReputation(pioneerId: string | null) {
  const [userReputation, setUserReputation] = useState<UserReputationState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user reputation
  const fetchReputation = useCallback(async () => {
    if (!pioneerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await unifiedReputationService.getUserReputation(pioneerId);
      setUserReputation(data);
    } catch (err) {
      console.error('Error fetching reputation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reputation');
    } finally {
      setIsLoading(false);
    }
  }, [pioneerId]);

  // Initialize user reputation on first load
  useEffect(() => {
    if (pioneerId) {
      fetchReputation();
    }
  }, [pioneerId, fetchReputation]);

  // Sync reputation with wallet data
  const syncReputation = useCallback(async (walletData: any) => {
    if (!pioneerId) return;

    setError(null);

    try {
      const data = await unifiedReputationService.syncUserReputation(pioneerId, walletData);
      setUserReputation(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync reputation';
      setError(errorMsg);
      throw err;
    }
  }, [pioneerId]);

  // Record daily check-in
  const recordDailyCheckin = useCallback(async () => {
    if (!pioneerId) return;

    setError(null);

    try {
      const result = await unifiedReputationService.recordDailyCheckin(pioneerId);
      await fetchReputation(); // Refresh data
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to record check-in';
      setError(errorMsg);
      throw err;
    }
  }, [pioneerId, fetchReputation]);

  // Add referral
  const addReferral = useCallback(async (referredPioneerId: string) => {
    if (!pioneerId) return;

    setError(null);

    try {
      const data = await unifiedReputationService.addReferral(pioneerId, referredPioneerId);
      setUserReputation(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add referral';
      setError(errorMsg);
      throw err;
    }
  }, [pioneerId]);

  // Record task completion
  const recordTaskCompletion = useCallback(async (taskId: string, points: number) => {
    if (!pioneerId) return;

    setError(null);

    try {
      const data = await unifiedReputationService.recordTaskCompletion(pioneerId, taskId, points);
      setUserReputation(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to record task';
      setError(errorMsg);
      throw err;
    }
  }, [pioneerId]);

  return {
    userReputation,
    isLoading,
    error,
    fetchReputation,
    syncReputation,
    recordDailyCheckin,
    addReferral,
    recordTaskCompletion,
  };
}
