/**
 * Pi Payment Module - Handle Pi Network payments
 */

import type { PaymentData } from './types';

declare global {
  interface Window {
    Pi?: any;
  }
}

/**
 * Check if Pi SDK is available
 */
export function isPiAvailable(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * Initialize Pi SDK
 */
export async function initializePi(): Promise<void> {
  if (!isPiAvailable()) {
    console.warn('[PI PAYMENT] Pi SDK not available');
    return;
  }
  
  try {
    await window.Pi!.init({ version: '2.0' });
    console.log('[PI PAYMENT] SDK initialized');
  } catch (error) {
    console.error('[PI PAYMENT] Init failed:', error);
    throw error;
  }
}

/**
 * Authenticate user
 */
export async function authenticate(): Promise<{ uid: string; username: string }> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK not available');
  }
  
  try {
    const scopes = ['username', 'payments'];
    const auth = await window.Pi!.authenticate(scopes, onIncompletePayment);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username
    };
  } catch (error) {
    console.error('[PI PAYMENT] Auth failed:', error);
    throw error;
  }
}

/**
 * Create VIP payment (1 Pi)
 */
export async function createVIPPayment(userId: string): Promise<PaymentData> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK not available. Please use Pi Browser.');
  }
  
  try {
    const payment = await window.Pi!.createPayment({
      amount: 1,
      memo: 'Reputa Score VIP Subscription - 1 Year',
      metadata: { type: 'vip_subscription', userId }
    }, {
      onReadyForServerApproval: (paymentId: string) => {
        console.log('[PI PAYMENT] Ready for approval:', paymentId);
        approvePayment(paymentId, userId, 1);
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log('[PI PAYMENT] Ready for completion:', paymentId, txid);
        completePayment(paymentId, txid, userId, 1);
      },
      onCancel: (paymentId: string) => {
        console.log('[PI PAYMENT] Cancelled:', paymentId);
      },
      onError: (error: Error) => {
        console.error('[PI PAYMENT] Error:', error);
      }
    });
    
    return {
      paymentId: payment.identifier,
      amount: 1,
      memo: 'VIP Subscription',
      status: 'pending',
      createdAt: new Date()
    };
  } catch (error) {
    console.error('[PI PAYMENT] Create failed:', error);
    throw error;
  }
}

/**
 * Approve payment (backend call)
 */
async function approvePayment(
  paymentId: string,
  userId: string,
  amount: number
): Promise<void> {
  try {
    const response = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, userId, amount })
    });
    
    if (!response.ok) {
      throw new Error('Approval failed');
    }
    
    console.log('[PI PAYMENT] Approved');
  } catch (error) {
    console.error('[PI PAYMENT] Approval error:', error);
  }
}

/**
 * Complete payment (backend call)
 */
async function completePayment(
  paymentId: string,
  txid: string,
  userId: string,
  amount: number
): Promise<void> {
  try {
    const response = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, txid, userId, amount })
    });
    
    if (!response.ok) {
      throw new Error('Completion failed');
    }
    
    const data = await response.json();
    console.log('[PI PAYMENT] Completed:', data);
    
    // Update local VIP status
    localStorage.setItem(`vip_${userId}`, JSON.stringify({
      active: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }));
  } catch (error) {
    console.error('[PI PAYMENT] Completion error:', error);
  }
}

/**
 * Handle incomplete payments
 */
function onIncompletePayment(payment: any): void {
  console.log('[PI PAYMENT] Incomplete payment found:', payment);
  // Resume payment flow
}

/**
 * Check VIP status
 */
export function checkVIPStatus(userId: string): boolean {
  const vipData = localStorage.getItem(`vip_${userId}`);
  if (!vipData) return false;
  
  try {
    const { active, expiresAt } = JSON.parse(vipData);
    return active && new Date(expiresAt) > new Date();
  } catch {
    return false;
  }
}
