/** 
 * Pi Payments Service
 * نظام المدفوعات الحقيقي المرتبط بـ Pi API Key
 */

import { createPayment, getCurrentUser } from './piSdk';
import type { PaymentData } from '../protocol/types';

/**
 * إنشاء دفع اشتراك VIP (1 Pi)
 * سيقوم هذا بفتح نافذة الدفع في متصفح Pi للمستخدم
 */
export async function createVIPSubscription(): Promise<PaymentData> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to upgrade');
    }

    const amount = 1; 
    const memo = 'Reputa Score VIP Subscription - Full Analytics Access';
    const metadata = {
      type: 'vip_subscription',
      userId: user.uid,
      tier: 'premium'
    };

    // استدعاء الـ SDK لفتح المعاملة
    // ملاحظة: الـ SDK سيطلب Approval من السيرفر الخاص بك تلقائياً عبر المسارات المعرفة
    const paymentId = await createPayment(amount, memo, metadata);

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
    console.error('[PAYMENT] VIP subscription failed:', error);
    throw error;
  }
}

/**
 * الموافقة على الدفع (Approve)
 * يتم استدعاؤها لإعلام السيرفر بأن التطبيق موافق على استلام الـ Pi
 */
export async function approvePayment(
  paymentId: string,
  userId: string,
  amount: number
): Promise<boolean> {
  try {
    // إرسال الطلب للسيرفر الذي يستخدم VITE_PI_API_KEY للمصادقة مع Pi Server
    const response = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, userId, amount })
    });

    if (!response.ok) throw new Error('Backend approval failed');

    const data = await response.json();
    if (data.approved) {
      updatePaymentStatus(paymentId, 'approved');
      console.log('[PAYMENT] Server Approved:', paymentId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PAYMENT] Approval failed:', error);
    return false;
  }
}

/**
 * إتمام الدفع (Complete)
 * يتم استدعاؤها بعد أن يؤكد البلوكشين نجاح التحويل
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

    if (!response.ok) throw new Error('Backend completion failed');

    const data = await response.json();
    if (data.completed) {
      updatePaymentStatus(paymentId, 'completed', txid);
      
      // تفعيل حالة الـ VIP محلياً فوراً
      updateVIPStatus(userId, true);
      
      console.log('[PAYMENT] Transaction Finalized:', txid);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PAYMENT] Completion failed:', error);
    return false;
  }
}

/**
 * إرسال Pi (لأغراض المكافآت أو التحويلات اليدوية)
 */
export async function sendPi(
  recipientId: string,
  amount: number,
  memo: string = ''
): Promise<PaymentData> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Authentication required');

    const metadata = { type: 'p2p_transfer', recipientId, senderId: user.uid };
    const paymentId = await createPayment(amount, memo || `Transfer to ${recipientId}`, metadata);

    const paymentData: PaymentData = {
      paymentId, amount, memo, userId: user.uid,
      status: 'pending', createdAt: new Date()
    };

    storePayment(paymentData);
    return paymentData;
  } catch (error) {
    console.error('[PAYMENT] Send Pi failed:', error);
    throw error;
  }
}

/**
 * وظائف المساعدة لتخزين البيانات محلياً (Helpers)
 */
export function getPaymentStatus(paymentId: string): PaymentData | null {
  const stored = localStorage.getItem(`payment_${paymentId}`);
  if (!stored) return null;
  try {
    const payment = JSON.parse(stored);
    return {
      ...payment,
      createdAt: new Date(payment.createdAt),
      completedAt: payment.completedAt ? new Date(payment.completedAt) : undefined
    };
  } catch { return null; }
}

export function getAllPayments(userId: string): PaymentData[] {
  const payments: PaymentData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('payment_')) {
      const p = JSON.parse(localStorage.getItem(key) || '{}');
      if (p.userId === userId) {
        payments.push({ ...p, createdAt: new Date(p.createdAt) });
      }
    }
  }
  return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function storePayment(payment: PaymentData): void {
  localStorage.setItem(`payment_${payment.paymentId}`, JSON.stringify(payment));
}

function updatePaymentStatus(paymentId: string, status: PaymentData['status'], txid?: string): void {
  const payment = getPaymentStatus(paymentId);
  if (!payment) return;
  payment.status = status;
  if (txid) payment.txid = txid;
  if (status === 'completed') payment.completedAt = new Date();
  storePayment(payment);
}

/**
 * التحقق من صلاحية VIP
 */
export function isVIPUser(userId: string): boolean {
  const vipStatus = localStorage.getItem(`vip_${userId}`);
  if (!vipStatus) return false;
  try {
    const data = JSON.parse(vipStatus);
    return new Date(data.expiresAt) > new Date();
  } catch { return false; }
}

function updateVIPStatus(userId: string, isVIP: boolean): void {
  if (isVIP) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // اشتراك لمدة سنة
    localStorage.setItem(`vip_${userId}`, JSON.stringify({
      userId, isVIP: true, activatedAt: new Date(), expiresAt
    }));
  } else {
    localStorage.removeItem(`vip_${userId}`);
  }
}

export function getVIPExpiration(userId: string): Date | null {
  const vipStatus = localStorage.getItem(`vip_${userId}`);
  return vipStatus ? new Date(JSON.parse(vipStatus).expiresAt) : null;
}
