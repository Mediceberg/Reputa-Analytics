import { createPayment, getCurrentUser } from './piSdk';
import type { PaymentData } from '../protocol/types';

/**
 * إنشاء دفع اشتراك VIP (1 Pi)
 * تم التعديل ليدعم نظام الـ Callbacks الإلزامي في شبكة Pi الحقيقية
 */
export async function createVIPPayment(userId: string): Promise<void> {
  try {
    const amount = 1;
    const memo = 'Reputa Score VIP Subscription - Full Analytics Access';
    const metadata = { type: 'vip_subscription', userId, tier: 'premium' };

    // استدعاء الـ SDK مع الـ Callbacks الإلزامية
    // هذا الجزء هو ما يمنع رسالة "Developer did not approve" و "Payment Expired"
    await window.Pi.createPayment({
      amount: amount,
      memo: memo,
      metadata: metadata,
    }, {
      // 1. عندما تصبح المعاملة جاهزة للموافقة من سيرفرك
      onReadyForServerApproval: async (paymentId: string) => {
        console.log('[PAYMENT] Ready for approval:', paymentId);
        return await approvePayment(paymentId, userId, amount);
      },
      // 2. عندما يتم الدفع على البلوكشين بنجاح
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log('[PAYMENT] Ready for completion:', txid);
        return await completePayment(paymentId, txid, userId, amount);
      },
      // 3. في حالة الإلغاء
      onCancel: (paymentId: string) => {
        console.log('[PAYMENT] Cancelled:', paymentId);
      },
      // 4. في حالة حدوث خطأ من الـ SDK
      onError: (error: Error, payment?: any) => {
        console.error('[PAYMENT] Error:', error);
        alert('Payment Error: ' + error.message);
      },
    });

  } catch (error) {
    console.error('[PAYMENT] Critical Failure:', error);
    throw error;
  }
}

/**
 * وظيفة الموافقة (Approve) - ترسل المعرف للسيرفر الخاص بك
 */
export async function approvePayment(paymentId: string, userId: string, amount: number) {
  const response = await fetch('/api/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, userId, amount })
  });
  const data = await response.json();
  return data.paymentId; // يجب أن يعيد المعرف للسيرفر
}

/**
 * وظيفة الإتمام (Complete) - تسجل المعاملة في السيرفر وتفعل الـ VIP
 */
export async function completePayment(paymentId: string, txid: string, userId: string, amount: number) {
  const response = await fetch('/api/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, txid, userId, amount })
  });
  const data = await response.json();
  if (data.completed) {
    updateVIPStatus(userId, true); // تفعيل الـ VIP محلياً
    return data.paymentId;
  }
}

// دالة فحص حالة الـ VIP للاستخدام في الواجهة
export function checkVIPStatus(userId: string): boolean {
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
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    localStorage.setItem(`vip_${userId}`, JSON.stringify({
      userId, isVIP: true, activatedAt: new Date(), expiresAt
    }));
  }
}

