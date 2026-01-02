/**
 * Pi Payments Service
 * 
 * Handles all payment operations including VIP subscriptions,
 * receiving, and sending Pi
 */

import { createPayment, getCurrentUser } from './piSdk';
import type { PaymentData } from '../protocol/types';

/**
 * Create VIP subscription payment
 */
export async function createVIPSubscription(): Promise<PaymentData> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const amount = 1; // 1 Pi for VIP subscription
    const memo = 'Reputa Score VIP Subscription - 1 Year';
    const metadata = {
      type: 'vip_subscription',
      duration: 'yearly',
      userId: user.uid
    };

    const paymentId = await createPayment(amount, memo, metadata);

    const paymentData: PaymentData = {
      paymentId,
      amount,
      memo,
      userId: user.uid,
      status: 'pending',
      createdAt: new Date()
    };

    // Store payment in local state/storage
    storePayment(paymentData);

    return paymentData;
  } catch (error) {
    console.error('[PAYMENT] VIP subscription failed:', error);
    throw error;
  }
}

/**
 * Approve payment (called by backend)
 */
export async function approvePayment(
  paymentId: string,
  userId: string,
  amount: number
): Promise<boolean> {
  try {
    const response = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, userId, amount })
    });

    if (!response.ok) {
      throw new Error('Payment approval failed');
    }

    const data = await response.json();
    
    if (data.approved) {
      updatePaymentStatus(paymentId, 'approved');
      console.log('[PAYMENT] Payment approved:', paymentId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PAYMENT] Approval failed:', error);
    return false;
  }
}

/**
 * Complete payment (called after blockchain confirmation)
 */
export async function completePayment(
  paymentId: string,
  txid: string,
  userId: string,
  amount: number
): Promise<boolean> {
  try {
    const response = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, txid, userId, amount })
    });

    if (!response.ok) {
      throw new Error('Payment completion failed');
    }

    const data = await response.json();

    if (data.completed) {
      updatePaymentStatus(paymentId, 'completed', txid);
      console.log('[PAYMENT] Payment completed:', paymentId, txid);
      
      // Update local VIP status
      updateVIPStatus(userId, true);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PAYMENT] Completion failed:', error);
    return false;
  }
}

/**
 * Create payment for custom amount (send Pi)
 */
export async function sendPi(
  recipientId: string,
  amount: number,
  memo: string = ''
): Promise<PaymentData> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const metadata = {
      type: 'send',
      recipientId,
      senderId: user.uid
    };

    const paymentId = await createPayment(amount, memo || `Send ${amount} Pi`, metadata);

    const paymentData: PaymentData = {
      paymentId,
      amount,
      memo,
      userId: user.uid,
      status: 'pending',
      createdAt: new Date()
    };

    storePayment(paymentData);

    return paymentData;
  } catch (error) {
    console.error('[PAYMENT] Send Pi failed:', error);
    throw error;
  }
}

/**
 * Get payment status
 */
export function getPaymentStatus(paymentId: string): PaymentData | null {
  const stored = localStorage.getItem(`payment_${paymentId}`);
  if (!stored) {
    return null;
  }

  try {
    const payment = JSON.parse(stored);
    return {
      ...payment,
      createdAt: new Date(payment.createdAt),
      completedAt: payment.completedAt ? new Date(payment.completedAt) : undefined
    };
  } catch {
    return null;
  }
}

/**
 * Get all user payments
 */
export function getAllPayments(userId: string): PaymentData[] {
  const payments: PaymentData[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('payment_')) {
      try {
        const payment = JSON.parse(localStorage.getItem(key) || '');
        if (payment.userId === userId) {
          payments.push({
            ...payment,
            createdAt: new Date(payment.createdAt),
            completedAt: payment.completedAt ? new Date(payment.completedAt) : undefined
          });
        }
      } catch {
        // Skip invalid entries
      }
    }
  }

  return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Store payment in local storage
 */
function storePayment(payment: PaymentData): void {
  try {
    localStorage.setItem(`payment_${payment.paymentId}`, JSON.stringify(payment));
  } catch (error) {
    console.error('[PAYMENT] Failed to store payment:', error);
  }
}

/**
 * Update payment status
 */
function updatePaymentStatus(
  paymentId: string,
  status: PaymentData['status'],
  txid?: string
): void {
  const payment = getPaymentStatus(paymentId);
  if (!payment) {
    return;
  }

  payment.status = status;
  if (txid) {
    payment.txid = txid;
  }
  if (status === 'completed') {
    payment.completedAt = new Date();
  }

  storePayment(payment);
}

/**
 * Check if user is VIP
 */
export function isVIPUser(userId: string): boolean {
  const vipStatus = localStorage.getItem(`vip_${userId}`);
  if (!vipStatus) {
    return false;
  }

  try {
    const data = JSON.parse(vipStatus);
    const expiresAt = new Date(data.expiresAt);
    return expiresAt > new Date();
  } catch {
    return false;
  }
}

/**
 * Update VIP status
 */
function updateVIPStatus(userId: string, isVIP: boolean): void {
  if (isVIP) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year

    localStorage.setItem(`vip_${userId}`, JSON.stringify({
      userId,
      isVIP: true,
      activatedAt: new Date(),
      expiresAt
    }));
  } else {
    localStorage.removeItem(`vip_${userId}`);
  }
}

/**
 * Get VIP expiration date
 */
export function getVIPExpiration(userId: string): Date | null {
  const vipStatus = localStorage.getItem(`vip_${userId}`);
  if (!vipStatus) {
    return null;
  }

  try {
    const data = JSON.parse(vipStatus);
    return new Date(data.expiresAt);
  } catch {
    return null;
  }
}

/**
 * Cancel payment (if possible)
 */
export function cancelPayment(paymentId: string): void {
  const payment = getPaymentStatus(paymentId);
  if (!payment) {
    return;
  }

  if (payment.status === 'pending') {
    updatePaymentStatus(paymentId, 'failed');
    console.log('[PAYMENT] Payment cancelled:', paymentId);
  }
}
