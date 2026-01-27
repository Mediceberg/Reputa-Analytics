export async function initializePiSDK(): Promise<void> {
  if (typeof window === 'undefined' || !('Pi' in window)) return;
  
  const Pi = (window as any).Pi;
  
  try {
    // محاولة التهيئة مع مهلة زمنية قصيرة جداً لتجنب التعليق
    await Promise.race([
      Pi.init({ version: '2.0', sandbox: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
    ]);
    console.log('[PI SDK] Testnet Mode Active');
  } catch (error) {
    // في حال التعليق، نقوم بتخطي المرحلة لفتح التطبيق
    console.warn('[PI SDK] Init bypassed to fix hang issue');
  }
}

export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<any> {
  if (typeof window === 'undefined' || !('Pi' in window)) {
    return { username: "Guest_Explorer", uid: "demo" };
  }

  try {
    // طلب التوثيق مباشرة هو ما سيُفعل وضع Testnet عند ظهور نافذة المحفظة
    const auth = await (window as any).Pi.authenticate(scopes, (payment: any) => {
       console.log("Incomplete payment found on Testnet", payment);
    });
    return auth.user;
  } catch (error: any) {
    console.error('[PI SDK] Auth Failed:', error);
    throw error;
  }
}
