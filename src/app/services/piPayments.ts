export async function createVIPPayment(userId: string) {
  try {
    // التأكد من وجود Pi SDK في النافذة
    if (!window.Pi) throw new Error("Pi SDK not found");

    await window.Pi.createPayment({
      amount: 1,
      memo: "VIP Subscription for Reputa Score",
      metadata: { userId: userId, type: "vip_upgrade" },
    }, {
      // هذه هي النقطة التي تفشل حالياً (يجب أن ترد على السيرفر فوراً)
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("Payment ready for approval:", paymentId);
        // إرسال المعرف إلى السيرفر الخاص بك للموافقة عليه لدى Pi Network
        return await fetch('/api/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        // إخبار السيرفر بأن المستخدم دفع بالفعل على البلوكشين
        return await fetch('/api/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid })
        });
      },
      onCancel: (paymentId: string) => console.log("Payment cancelled"),
      onError: (error: Error, payment?: any) => console.error("Payment error", error),
    });
  } catch (err) {
    console.error(err);
  }
}
