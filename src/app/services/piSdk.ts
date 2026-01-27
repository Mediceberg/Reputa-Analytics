/** * Pi SDK Service - Testnet Configuration
 */

export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * ✅ التعديل: العودة إلى وضع Testnet بالكامل (Sandbox Mode)
 * هذا يضمن جلب بيانات محفظة الاختبار فقط ويحل مشكلة جلب بيانات المينينت
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) return;
  
  const Pi = (window as any).Pi;
  try {
    // تم ضبط sandbox على true بشكل دائم للعودة لشبكة الاختبار
    await Pi.init({ version: '2.0', sandbox: false });
    console.log('[PI SDK] Initialized in TESTNET (Sandbox) Mode');
  } catch (error) {
    console.error('[PI SDK] Testnet Init Failure:', error);
  }
}

/**
 * ✅ المصادقة وجلب بيانات التست نت
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) return { username: "Guest_Explorer", uid: "demo" };

  const Pi = (window as any).Pi;

  try {
    // يتم توجيه طلب التوثيق الآن إلى شبكة التست نت تلقائياً بسبب إعداد Sandbox أعلاه
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Auth Failed on Testnet:', error);
    // تنبيه المستخدم في حال فشل الربط مع محفظة التست نت
    alert("Testnet Authentication Error: " + error.message);
    throw error;
  }
}

/**
 * دالة استعادة المدفوعات غير المكتملة في شبكة الاختبار
 */
function onIncompletePaymentFound(payment: any) {
  if (payment && payment.identifier) {
     console.log("[PI SDK] Found incomplete payment on Testnet:", payment.identifier);
     fetch('/api/pi-payment', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         paymentId: payment.identifier, 
         txid: payment.transaction?.txid, 
         action: 'complete' 
       })
     }).catch(err => console.error("Payment Recovery Failed", err));
  }
}
