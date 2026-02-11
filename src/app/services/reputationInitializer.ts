/**
 * Initialize Unified Reputation System on App Startup
 * This should be called once when the user logs in
 */

import { unifiedReputationService } from '../services/unifiedReputationService';

const REPUTATION_CACHE_SCHEMA_KEY = 'reputationCacheSchemaVersion';
const REPUTATION_CACHE_SCHEMA_VERSION = 'atomic_v2';

const LEGACY_REPUTATION_KEYS = new Set([
  'userReputation',
  'reputationInitializedAt',
  'demoPoints',
  'cachedReputation',
  'reputationScore',
  'legacyReputationScore',
  'reputaScore',
]);

function isLegacyReputationKey(key: string): boolean {
  if (LEGACY_REPUTATION_KEYS.has(key)) return true;
  if (key.startsWith('reputation_')) return true;
  if (key.startsWith('demoPoints.')) return true;
  return false;
}

export function migrateLegacyReputationCache(): { migrated: boolean; removedKeys: string[] } {
  if (typeof window === 'undefined') {
    return { migrated: false, removedKeys: [] };
  }

  const existingVersion = localStorage.getItem(REPUTATION_CACHE_SCHEMA_KEY);
  if (existingVersion === REPUTATION_CACHE_SCHEMA_VERSION) {
    return { migrated: false, removedKeys: [] };
  }

  const removedKeys: string[] = [];

  const removeFromStorage = (storage: Storage) => {
    const keysToRemove: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      if (isLegacyReputationKey(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      storage.removeItem(key);
      removedKeys.push(key);
    });
  };

  removeFromStorage(localStorage);
  removeFromStorage(sessionStorage);

  unifiedReputationService.clearCache();
  localStorage.setItem(REPUTATION_CACHE_SCHEMA_KEY, REPUTATION_CACHE_SCHEMA_VERSION);

  console.log('🧹 Reputation cache migration completed', {
    version: REPUTATION_CACHE_SCHEMA_VERSION,
    removedKeys,
  });

  return {
    migrated: true,
    removedKeys,
  };
}

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
