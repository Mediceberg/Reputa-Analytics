/**
 * Pi Payment Module - Legacy functions for backward compatibility
 * Main payment functions are in src/app/services/piPayments.ts
 */

import type { PaymentData } from './types'; 

/**
 * Check if Pi SDK is available
 */
export function isPiAvailable(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * Initialize Pi SDK - التأكد من النسخة والتشغيل
 * @deprecated Use initializePiSDK from '../services/piSdk' instead
 */
export async function initializePi(): Promise<void> {
  if (!isPiAvailable()) {
    console.warn('[PI PAYMENT] Pi SDK not available');
    return;
  }
  
  try {
    const Pi = (window as any).Pi;
    await Pi.init({ version: '2.0' });
    console.log('[PI PAYMENT] SDK initialized');
  } catch (error) {
    console.error('[PI PAYMENT] Init failed:', error);
    throw error;
  }
}

/**
 * Authenticate user - جلب البيانات الحقيقية للمستخدم
 * @deprecated Use authenticateUser from '../services/piSdk' instead
 */
export async function authenticate(): Promise<{ uid: string; username: string }> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK not available');
  }
  
  try {
    const Pi = (window as any).Pi;
    const scopes = ['username', 'payments'];
    const auth = await Pi.authenticate(scopes, onIncompletePayment);
    
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
 * Create VIP payment (1 Pi) - Legacy version
 * @deprecated Use createVIPPayment from '../services/piPayments' instead
 */
export async function createVIPPaymentLegacy(userId: string): Promise<PaymentData> {
  if (!isPiAvailable()) {
    throw new Error('Pi SDK not available. Please use Pi Browser.');
  }
  
  try {
    const Pi = (window as any).Pi;
    const payment = await Pi.createPayment({
      amount: 1,
      memo: 'Reputa Score VIP Subscription - Testnet',
      metadata: { type: 'vip_subscription', userId, network: 'testnet' }
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
    
    if (!payment || !payment.identifier) {
      throw new Error('Payment creation returned no identifier');
    }
    
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
 * Approve payment (backend call) - الحفاظ على نفس المسار
 */
async function approvePayment(
  paymentId: string,
  userId: string,
  amount: number
): Promise<void> {
  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', paymentId, userId, amount, network: 'testnet' })
    });
    
    if (!response.ok) {
      throw new Error('Approval failed');
    }
    
    console.log('[PI PAYMENT] Approved on backend');
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
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', paymentId, txid, userId, amount, network: 'testnet' })
    });
    
    if (!response.ok) {
      throw new Error('Completion failed');
    }
    
    const data = await response.json();
    console.log('[PI PAYMENT] Completed successfully:', data);
    
    // تحديث الحالة محلياً كما هو في منطقك الأصلي
    localStorage.setItem(`vip_${userId}`, JSON.stringify({
      active: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
  } catch (error) {
    console.error('[PI PAYMENT] Completion error:', error);
  }
}

function onIncompletePayment(payment: any): void {
  console.log('[PI PAYMENT] Incomplete payment found:', payment);
  // يمكن هنا استدعاء /api/incomplete لإغلاق العمليات المعلقة
}

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
