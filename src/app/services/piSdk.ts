/** * Pi SDK Service - Unified wrapper for Pi Network SDK
 */

export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * ✅ الحل السحري: محاولة التهيئة بدون "حبس" الكود في انتظار Sandbox
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) return;
  
  const Pi = (window as any).Pi;
  try {
    // نلغي الـ Sandbox مؤقتاً أو نجعله خياراً ثانوياً ليعود الربط للعمل
    // إذا كنت تريد العودة للحالة التي كانت تعمل، اجعل sandbox: false
    await Pi.init({ version: '2.0', sandbox:  false });
    console.log('[PI SDK] Initialized in Standard Mode');
  } catch (error) {
    console.warn('[PI SDK] Standard Init failed, trying Sandbox...');
    try {
      await Pi.init({ version: '2.0', sandbox: true });
    } catch (e) {
      console.error('[PI SDK] Global Init Failure');
    }
  }
}

/**
 * ✅ إعادة زر Link Account للحياة
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) return { username: "Guest_Explorer", uid: "demo" };

  const Pi = (window as any).Pi;

  try {
    // 💡 التعديل الأهم: استدعاء المصادقة مباشرة دون انتظار طويل
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Auth Failed:', error);
    // إظهار الرسالة فقط إذا فشل الأمر تماماً
    alert("Authentication Error: " + error.message);
    throw error;
  }
}

function onIncompletePaymentFound(payment: any) {
  if (payment && payment.identifier) {
     fetch('/api/pi-payment', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction?.txid, action: 'complete' })
     }).catch(err => console.error("Payment Recovery Failed", err));
  }
} 
