/** * Pi SDK Service - Unified wrapper for Pi Network SDK
 */

import type { PiUser } from '../protocol/types';

export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * ✅ التعديل الحاسم: تهيئة سريعة تمنع تعليق المتصفح
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) return;
  try {
    const Pi = (window as any).Pi;
    // إضافة timeout بسيط للتهيئة لمنع التجمد اللانهائي
    await Promise.race([
      Pi.init({ version: '2.0', sandbox: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Init Timeout")), 3000))
    ]);
    console.log('[PI SDK] Sandbox Ready');
  } catch (error) {
    console.warn('[PI SDK] Init skipped or already active');
  }
}

/**
 * ✅ تعديل المصادقة: إجبار نافذة الربط على الظهور
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) return { username: "Guest_Explorer", uid: "demo" };

  try {
    const Pi = (window as any).Pi;

    // 💡 خطوة الإنقاذ: إذا كان الـ SDK غير مستجيب، نحاول تهيئته فوراً قبل طلب الربط
    if (typeof Pi.authenticate !== 'function') {
      await initializePiSDK();
    }

    // إطلاق عملية المصادقة
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Auth Error:', error);
    // إذا وصلنا هنا، سيعرف المستخدم السبب الحقيقي (مثلاً: الرابط غير مطابق للبوابة)
    alert("Pi Auth Detail: " + (error.message || "Connection refused by Pi Browser"));
    throw error;
  }
}

function onIncompletePaymentFound(payment: any) {
  console.log('[PI SDK] Incomplete payment found:', payment);
  if (payment && payment.identifier) {
     fetch('/api/pi-payment', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction?.txid, action: 'complete' })
     }).catch(err => console.error("Recovery failed", err));
  }
}
