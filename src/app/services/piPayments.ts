export async function createVIPPayment(uid: string, onSuccess: () => void) {
  // التأكد من وجود Pi SDK في نافذة المتصفح
  if (!(window as any).Pi) {
    alert("❌ Please open this app in Pi Browser");
    return;
  } 

  try {
    // تم التأكد من أن التهيئة في piSdk.ts هي sandbox: true
    // استدعاء عملية الدفع في بيئة الاختبار (Testnet)
    await (window as any).Pi.createPayment({
      amount: 1, // هذا سيكون 1 Test Pi
      memo: "Reputa Score VIP Access (Testnet)",
      metadata: { uid, plan: "vip", network: "testnet" }, // إضافة تعريف الشبكة للميتا داتا
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        // الموافقة على الدفع من خلال السيرفر الخاص بك
        await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, action: 'approve', uid }),
        });
        console.log("[Payment] Approved on Server");
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        // إكمال الدفع وتحديث حالة المستخدم في قاعدة البيانات
        const res = await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid, action: 'complete', uid }),
        });

        if (res.ok) {
          console.log("[Payment] Successfully Completed");
          onSuccess();
        } else {
          // في حال فشل السيرفر في الخطوة الأخيرة
          const errorData = await res.json();
          alert("❌ Final step failed: " + (errorData.message || "Unknown Error"));
        }
      },

      onCancel: () => {
        console.warn("[Payment] User cancelled the transaction");
        alert("❌ Payment cancelled");
      },

      onError: (error: any) => {
        // معالجة أخطاء الـ SDK (مثل تعارض الشبكة)
        console.error("[Payment] SDK Error:", error);
        alert("❌ Pi SDK Error: " + (error.message || JSON.stringify(error)));
      },
    });
  } catch (err: any) {
    // معالجة أخطاء الاتصال أو الـ API
    alert("❌ Connection Error: " + err.message);
  }
}
