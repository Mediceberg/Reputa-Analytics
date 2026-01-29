/**
 * هذا الملف مسؤول عن تنفيذ عمليات الدفع من التطبيق للمستخدم (App-to-User)
 * يتم ذلك عبر طلب مباشر للسيرفر لضمان عدم حدوث خطأ "Paiement expiré"
 */

export const executeExternalPayout = async (
  address: string, 
  amount: number, 
  memo: string
) => {
  try {
    console.log(`[Payout] Initiating payout of ${amount} Pi to: ${address}`);

    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'payout', // إشارة للسيرفر أن هذه عملية إرسال وليست استقبال
        paymentId: 'outbound_' + Date.now(), // معرف مؤقت للعملية الصادرة
        address: address,
        amount: amount,
        memo: memo
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Payout failed at server level');
    }

    console.log('[Payout] Success:', result.data);
    return result.data;

  } catch (error) {
    console.error('[Payout Error]:', error);
    throw error;
  }
};
