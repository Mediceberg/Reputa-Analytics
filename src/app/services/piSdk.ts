/**
 * Pi SDK Service - Unified wrapper for Pi Network SDK
 * 
 * IMPORTANT: Only use this service to interact with Pi SDK
 * Never call window.Pi directly from components
 */

import type { PiUser } from '../protocol/types';

// Check if running in Pi Browser
export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

// Get Pi SDK instance (only in Pi Browser)
function getPiSDK() {
  if (!isPiBrowser()) {
    throw new Error('Pi SDK is only available in Pi Browser');
  }
  return (window as any).Pi;
}

/**
 * Initialize Pi SDK
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) {
    console.warn('[PI SDK] Not running in Pi Browser - SDK features disabled');
    return;
  }

  try {
    const Pi = getPiSDK();
    await Pi.init({
      version: '2.0',
      sandbox: process.env.VITE_PI_NETWORK === 'testnet'
    });
    console.log('[PI SDK] Initialized successfully');
  } catch (error) {
    console.error('[PI SDK] Initialization failed:', error);
    throw error;
  }
}

/**
 * Authenticate user with Pi Network
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments']): Promise<PiUser> {
  if (!isPiBrowser()) {
    throw new Error('Authentication requires Pi Browser');
  }

  try {
    const Pi = getPiSDK();
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);

    const user: PiUser = {
      uid: auth.user.uid,
      username: auth.user.username,
      accessToken: auth.accessToken
    };

    // Call backend to verify and store session
    await verifyAuthentication(user.accessToken, user);

    console.log('[PI SDK] User authenticated:', user.username);
    return user;
  } catch (error) {
    console.error('[PI SDK] Authentication failed:', error);
    throw error;
  }
}

/**
 * Handle incomplete payments
 */
function onIncompletePaymentFound(payment: any) {
  console.log('[PI SDK] Incomplete payment found:', payment);
  // Handle incomplete payment - will be implemented in piPayments.ts
}

/**
 * Verify authentication with backend
 */
async function verifyAuthentication(accessToken: string, user: PiUser): Promise<void> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, user })
    });

    if (!response.ok) {
      throw new Error('Authentication verification failed');
    }

    const data = await response.json();
    console.log('[PI SDK] Authentication verified:', data);
  } catch (error) {
    console.error('[PI SDK] Verification failed:', error);
    throw error;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<PiUser | null> {
  if (!isPiBrowser()) {
    return null;
  }

  try {
    const Pi = getPiSDK();
    const user = await Pi.getUser();
    
    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      username: user.username
    };
  } catch (error) {
    console.error('[PI SDK] Failed to get current user:', error);
    return null;
  }
}

/**
 * Create payment
 */
export async function createPayment(
  amount: number,
  memo: string,
  metadata: any
): Promise<string> {
  if (!isPiBrowser()) {
    throw new Error('Payments require Pi Browser');
  }

  try {
    const Pi = getPiSDK();
    const payment = await Pi.createPayment({
      amount,
      memo,
      metadata
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log('[PI SDK] Payment ready for approval:', paymentId);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log('[PI SDK] Payment ready for completion:', paymentId, txid);
      },
      onCancel: (paymentId: string) => {
        console.log('[PI SDK] Payment cancelled:', paymentId);
      },
      onError: (error: Error, payment: any) => {
        console.error('[PI SDK] Payment error:', error, payment);
      }
    });

    return payment.identifier;
  } catch (error) {
    console.error('[PI SDK] Failed to create payment:', error);
    throw error;
  }
}

/**
 * Open Pi Wallet
 */
export async function openPiWallet(): Promise<void> {
  if (!isPiBrowser()) {
    throw new Error('Pi Wallet requires Pi Browser');
  }

  try {
    const Pi = getPiSDK();
    await Pi.openWallet();
    console.log('[PI SDK] Wallet opened');
  } catch (error) {
    console.error('[PI SDK] Failed to open wallet:', error);
    throw error;
  }
}

/**
 * Share content
 */
export async function shareContent(title: string, message: string): Promise<void> {
  if (!isPiBrowser()) {
    // Fallback to web share API
    if (navigator.share) {
      await navigator.share({ title, text: message });
    } else {
      console.warn('[PI SDK] Sharing not supported');
    }
    return;
  }

  try {
    const Pi = getPiSDK();
    await Pi.openShareDialog(title, message);
    console.log('[PI SDK] Share dialog opened');
  } catch (error) {
    console.error('[PI SDK] Failed to share:', error);
  }
}

/**
 * Get wallet address (requires authentication)
 */
export async function getWalletAddress(): Promise<string | null> {
  if (!isPiBrowser()) {
    return null;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    // Fetch wallet address from backend
    const response = await fetch('/api/get-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid })
    });

    if (response.ok) {
      const data = await response.json();
      return data.wallet?.walletAddress || null;
    }

    return null;
  } catch (error) {
    console.error('[PI SDK] Failed to get wallet address:', error);
    return null;
  }
}
