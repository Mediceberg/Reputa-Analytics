export async function createVIPPayment(userId: string, onSuccess: () => void) {
  try {
    // 1. التأكد من وجود Pi SDK
    if (!window.Pi) {
      alert("الرجاء فتح التطبيق من داخل متصفح Pi");
      throw new Error("Pi SDK not found");
    }

    await window.Pi.createPayment({
      amount: 1,
      memo: "VIP Subscription for Reputa Score",
      metadata: { userId: userId, type: "vip_upgrade" },
    }, {
      // 2. مرحلة الموافقة (Approve)
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("إرسال طلب الموافقة للسيرفر:", paymentId);
        
        const response = await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, action: 'approve' })
        });

        if (response.ok) {
          console.log("تمت الموافقة من السيرفر بنجاح");
          return paymentId; // الـ SDK يحتاج معرف الدفع للاستمرار
        }
        throw new Error("فشل السيرفر في الموافقة على الدفع");
      },

      // 3. مرحلة الإتمام (Complete) بعد الدفع على البلوكشين
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("الدفع تم على البلوكشين، جاري التأكيد:", txid);
        
        const response = await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid, action: 'complete' })
        });

        if (response.ok) {
          console.log("تم تفعيل اشتراك VIP بنجاح");
          onSuccess(); // تنفيذ الدالة التي تفتح الميزات للمستخدم (مثل إغلاق المودال)
          return paymentId;
        }
        throw new Error("فشل تأكيد العملية في السيرفر");
      },

      onCancel: (paymentId: string) => {
        console.log("تم إلغاء عملية الدفع من قبل المستخدم:", paymentId);
      },

      onError: (error: Error, payment?: any) => {
        console.error("خطأ في عملية الدفع:", error);
        alert("حدث خطأ أثناء الدفع، يرجى المحاولة لاحقاً");
      },
    });
  } catch (err) {
    console.error("Critical Payment Error:", err);
  }
}
