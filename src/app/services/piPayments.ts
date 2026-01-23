export async function createVIPPayment(uid: string, onSuccess: () => void) {
  if (!window.Pi) {
    alert("❌ Please open this app in Pi Browser");
    return;
  } 

  try {
    // 1️⃣ إنشاء الدفع مباشرة عبر الـ SDK (باي لا تحتاج لخطوة 'create' من السيرفر مسبقاً في أغلب الإعدادات البسيطة)
    // ملاحظة: إذا كان السيرفر يتوقع خطوة إنشاء أولية، يجب تعديل السيرفر، لكن كود السيرفر الحالي يبدأ من approve
    
    await window.Pi.createPayment({
      amount: 1, 
      memo: "Reputa Score VIP Access",
      metadata: { uid, plan: "vip" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        // نرسل الطلب إلى ملفك الموحد pi-payment مع action: approve
        await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, action: 'approve', uid }),
        });
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        // نرسل الطلب إلى ملفك الموحد مع action: complete
        const res = await fetch('/api/pi-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, txid, action: 'complete', uid }),
        });

        if (res.ok) {
          onSuccess();
        } else {
          alert("❌ Final step failed. Please contact support.");
        }
      },

      onCancel: () => {
        alert("❌ Payment cancelled");
      },

      onError: (error: any) => {
        alert("❌ Pi SDK Error: " + JSON.stringify(error));
      },
    });
  } catch (err: any) {
    alert("❌ Connection Error: " + err.message);
  }
}
