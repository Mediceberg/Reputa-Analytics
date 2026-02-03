/**
 * Initialize Unified Reputation System on App Startup
 * This should be called once when the user logs in
 */

import { unifiedReputationService } from '../services/unifiedReputationService';

export async function initializeUnifiedReputationOnLogin(
  pioneerId: string,
  walletAddress: string,
  username: string
) {
  try {
    console.log('🚀 Initializing Unified Reputation System...');

    // Initialize user in MongoDB
    const userReputation = await unifiedReputationService.initializeUserReputation(
      pioneerId,
      walletAddress,
      username
    );

    console.log('✅ Unified Reputation System Initialized:', userReputation);

    // Store in localStorage for quick access
    localStorage.setItem('userReputation', JSON.stringify(userReputation));
    localStorage.setItem('reputationInitializedAt', new Date().toISOString());

    return userReputation;
  } catch (error) {
    console.error('❌ Failed to initialize reputation system:', error);
    throw error;
  }
}

/**
 * Get cached reputation from localStorage
 */
export function getCachedReputation() {
  try {
    const cached = localStorage.getItem('userReputation');
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Error reading cached reputation:', error);
    return null;
  }
}

/**
 * Clear reputation cache
 */
export function clearReputationCache() {
  localStorage.removeItem('userReputation');
  localStorage.removeItem('reputationInitializedAt');
  unifiedReputationService.clearCache();
}
