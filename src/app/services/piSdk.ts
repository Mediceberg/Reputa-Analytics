/** * Pi SDK Service - Fix for "Initialising" stuck issue
 */

export function isPiBrowser(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

/**
 * ✅ حل مشكلة التعليق: إضافة مهلة زمنية للتهيئة
 */
export async function initializePiSDK(): Promise<void> {
  if (!isPiBrowser()) return;
  
  const Pi = (window as any).Pi;
  
  // إنشاء وعد (Promise) ينتهي بالفشل إذا تأخرت التهيئة عن 5 ثوانٍ
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Init Timeout")), 5000)
  );

  try {
    // محاولة التهيئة في وضع Sandbox (Testnet)
    await Promise.race([
      Pi.init({ version: '2.0', sandbox: true }),
      timeout
    ]);
    console.log('[PI SDK] Initialized in Testnet Mode');
  } catch (error) {
    // إذا فشل أو تأخر، نستمر على أي حال لفتح التطبيق
    console.warn('[PI SDK] Init issues, bypassing to open app:', error);
  }
}

/**
 * ✅ جلب بيانات المستخدم من التست نت
 */
export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (!isPiBrowser()) return { username: "Guest_Explorer", uid: "demo" };

  const Pi = (window as any).Pi;

  try {
    // طلب التوثيق مباشرة - هذا ما سيفتح نافذة المحفظة في التست نت
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    return {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
  } catch (error: any) {
    console.error('[PI SDK] Auth Failed:', error);
    // إذا كان الخطأ بسبب المينينت، سيخبرك المتصفح هنا
    throw error;
  }
}

function onIncompletePaymentFound(payment: any) {
  // منطق استعادة المدفوعات يبقى كما هو
  console.log("Incomplete payment check on Testnet");
}
