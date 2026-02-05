/**
 * Referral Service
 * Handles referral tracking, confirmation, and initialization
 */

import { useReferral } from '../hooks/useReferral';

const API_BASE = '/api/referral';

/**
 * Initialize referral system on login
 * - Check if user has ref code in localStorage
 * - Track the referral if code exists
 * - Generate referral code for the user
 */
export async function initializeReferralOnLogin(walletAddress: string): Promise<void> {
  try {
    console.log('🎯 Initializing Referral System...');

    // Check for referral code in localStorage or URL
    const refCode = localStorage.getItem('ref_code') || 
                   new URLSearchParams(window.location.search).get('ref') ||
                   sessionStorage.getItem('ref_code');

    if (refCode) {
      console.log('📌 Found referral code:', refCode);
      // Track the referral
      await trackReferral(walletAddress, refCode);
      // Clear from session after tracking
      localStorage.removeItem('ref_code');
      sessionStorage.removeItem('ref_code');
    }

    // Generate/Get referral code for this user
    await generateReferralCode(walletAddress);

    console.log('✅ Referral System Initialized');
  } catch (error) {
    console.error('❌ Failed to initialize referral system:', error);
    // Don't throw - referral system is optional
  }
}

/**
 * Track a new referral
 */
export async function trackReferral(walletAddress: string, referralCode: string): Promise<boolean> {
  if (!walletAddress || !referralCode) {
    console.warn('[Referral] Missing walletAddress or referralCode');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletAddress.toLowerCase(),
        referralCode: referralCode.toUpperCase(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Referral tracked:', data.referral);
      return true;
    } else {
      console.warn('[Referral] Track failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('[Referral] Error tracking referral:', error);
    return false;
  }
}

/**
 * Confirm referral after first wallet analysis
 * Called after user completes wallet analysis
 */
export async function confirmReferralOnAnalysis(walletAddress: string): Promise<boolean> {
  if (!walletAddress) {
    console.warn('[Referral] Missing walletAddress');
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletAddress.toLowerCase(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Referral confirmed:', data.referral);
      return true;
    } else {
      console.warn('[Referral] Confirm failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('[Referral] Error confirming referral:', error);
    return false;
  }
}

/**
 * Generate/Get referral code for a user
 */
export async function generateReferralCode(walletAddress: string): Promise<string | null> {
  if (!walletAddress) {
    console.warn('[Referral] Missing walletAddress');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/code?walletAddress=${walletAddress}`);
    const data = await response.json();

    if (data.success && data.data) {
      console.log('✅ Referral code generated:', data.data.referralCode);
      // Store in localStorage for future use
      localStorage.setItem(`referral_code_${walletAddress}`, data.data.referralCode);
      return data.data.referralCode;
    } else {
      console.warn('[Referral] Generate code failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('[Referral] Error generating referral code:', error);
    return null;
  }
}

/**
 * Check and process referral code from URL
 */
export function captureReferralCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  if (refCode) {
    // Store in both localStorage and sessionStorage
    localStorage.setItem('ref_code', refCode);
    sessionStorage.setItem('ref_code', refCode);
    console.log('📌 Captured referral code from URL:', refCode);
    return refCode;
  }

  return null;
}

/**
 * Get stats for a user
 */
export async function getReferralStats(walletAddress: string) {
  if (!walletAddress) {
    console.warn('[Referral] Missing walletAddress');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/stats?walletAddress=${walletAddress}`);
    const data = await response.json();

    if (data.success && data.data) {
      return data.data;
    } else {
      console.warn('[Referral] Get stats failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('[Referral] Error getting referral stats:', error);
    return null;
  }
}

/**
 * Initialize referral event tracking
 * Listens for wallet analysis completion event
 */
export function setupReferralEventListeners(walletAddress: string): void {
  // Listen for wallet analysis completion
  const handleAnalysisComplete = async () => {
    console.log('📊 Wallet analysis completed, confirming referral...');
    await confirmReferralOnAnalysis(walletAddress);
  };

  // Create custom event listener
  window.addEventListener('wallet:analysis:complete', handleAnalysisComplete);

  // Cleanup function
  return () => {
    window.removeEventListener('wallet:analysis:complete', handleAnalysisComplete);
  };
}

/**
 * Dispatch wallet analysis complete event
 * Should be called after wallet analysis is done
 */
export function dispatchWalletAnalysisCompleteEvent(): void {
  const event = new CustomEvent('wallet:analysis:complete', {
    detail: { timestamp: new Date().toISOString() },
  });
  window.dispatchEvent(event);
  console.log('📢 Dispatched wallet analysis complete event');
}
