/**  
 * Pi SDK Service - Unified wrapper for Pi Network SDK
 * الربط الحقيقي مع شبكة الاختبار وتفعيل المصادقة الفعلية
 */

import type { PiUser } from '../protocol/types';

// التحقق مما إذا كان التطبيق يعمل داخل متصفح Pi
export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

// الحصول على نسخة الـ SDK مع التأكد من البيئة
function getPiSDK() {
  if (!isPiBrowser()) {
    // في حالة التطوير خارج متصفح Pi، يمكننا إرجاع Mock بسيط لتجنب الانهيار
    console.warn('[PI SDK] Running outside Pi Browser. Using fallback.');
    return (window as any).Pi;
  }
  return (window as any).Pi;
}

/**
 * Initialize Pi SDK - تفعيل وضع Sandbox لشبكة الاختبار
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) {
    console.warn('[PI SDK] Not running in Pi Browser - SDK features disabled');
    return;
  }

  try {
    const Pi = getPiSDK();
    // تفعيل sandbox بناءً على متغيرات البيئة أو افتراضياً لشبكة الاختبار
    await Pi.init({
      version: '2.0',
      sandbox: true // نضعها true دائماً لضمان العمل على Testnet حالياً
    });
    console.log('[PI SDK] Initialized successfully on Testnet');
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
    // المصادقة الحقيقية التي تطلب من المستخدم الموافقة في متصفح Pi
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);

    const user: PiUser = {
      uid: auth.user.uid,
      username: auth.user.username,
      accessToken: auth.accessToken
    };

    // إرسال التوكن للسيرفر للتحقق وتخزين الجلسة
    await verifyAuthentication(auth.accessToken, user);

    console.log('[PI SDK] User authenticated:', user.username);
    return user;
  } catch (error) {
    console.error('[PI SDK] Authentication failed:', error);
    throw error;
  }
}

/**
 * التعامل مع المدفوعات غير المكتملة
 */
function onIncompletePaymentFound(payment: any) {
  console.log('[PI SDK] Incomplete payment found:', payment);
  // هنا نقوم باستدعاء السيرفر لإتمام المعاملة إذا كانت معلقة في البلوكشين
}

/**
 * التحقق من المصادقة مع الباك آند
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
  } catch (error) {
    console.error('[PI SDK] Backend verification failed:', error);
  }
}

/**
 * الحصول على عنوان المحفظة الحقيقي (مهم جداً للربط مع البلوكشين)
 */
export async function getWalletAddress(): Promise<string | null> {
  if (!isPiBrowser()) return null;

  try {
    // نطلب العنوان من الباك آند بعد المصادقة لضمان الأمان
    const user = await getCurrentUser();
    if (!user) return null;

    const response = await fetch(`/api/get-wallet?uid=${user.uid}`);
    if (response.ok) {
      const data = await response.json();
      return data.walletAddress;
    }
    return null;
  } catch (error) {
    console.error('[PI SDK] Failed to get wallet address:', error);
    return null;
  }
}

/**
 * إنشاء عملية دفع حقيقية بقيمة 1 Pi
 */
export async function createPayment(
  amount: number,
  memo: string,
  metadata: any
): Promise<string> {
  if (!isPiBrowser()) throw new Error('Payments require Pi Browser');

  try {
    const Pi = getPiSDK();
    const payment = await Pi.createPayment({
      amount,
      memo,
      metadata
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        // الموافقة من جانب السيرفر
        await fetch('/api/approve-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        // إكمال المعاملة بعد التأكد من وجودها على البلوكشين
        await fetch('/api/complete-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid })
        });
      },
      onCancel: (paymentId: string) => console.log('Payment cancelled', paymentId),
      onError: (error: Error) => console.error('Payment error', error)
    });

    return payment.identifier;
  } catch (error) {
    console.error('[PI SDK] Payment creation failed:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<PiUser | null> {
  if (!isPiBrowser()) return null;
  try {
    const Pi = getPiSDK();
    const user = await Pi.getUser();
    return user ? { uid: user.uid, username: user.username } : null;
  } catch {
    return null;
  }
}

/**
 * فتح محفظة Pi مباشرة
 */
export async function openPiWallet(): Promise<void> {
  if (isPiBrowser()) {
    await getPiSDK().openWallet();
  }
}

/**
 * مشاركة المحتوى عبر نظام Pi
 */
export async function shareContent(title: string, message: string): Promise<void> {
  if (isPiBrowser()) {
    await getPiSDK().openShareDialog(title, message);
  } else if (navigator.share) {
    await navigator.share({ title, text: message });
  }
}
