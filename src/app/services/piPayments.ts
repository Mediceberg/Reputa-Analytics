export const createVIPPayment = async (uid: string, onSuccess: () => void) => {
  // 1. فحص وجود Pi في النافذة
  const Pi = (window as any).Pi;
  
  if (!Pi) {
    alert("Please open this app inside Pi Browser");
    return;
  }

  console.log("Starting payment for UID:", uid);

  try {
    // 2. استدعاء الدفع مع معالجة الأخطاء المباشرة
    await Pi.createPayment({
      amount: 1,
      memo: "Unlock VIP Insights - Reputa Score",
      metadata: { uid }
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("Server Approval Step:", paymentId);
        try {
          const res = await fetch('/api/pi-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, action: 'approve', uid })
          });
          if (!res.ok) throw new Error("Approval failed");
        } catch (err) {
          console.error("Approval fetch error:", err);
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("Server Completion Step:", txid);
        try {
          const res = await fetch('/api/pi-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid, action: 'complete', uid })
          });
          if (res.ok) {
            onSuccess();
          }
        } catch (err) {
          console.error("Completion fetch error:", err);
        }
      },
      onCancel: (paymentId: string) => {
        console.log("Payment cancelled by user", paymentId);
      },
      onError: (error: Error) => {
        console.error("SDK Error details:", error);
        alert("Payment Error: " + error.message);
      }
    });
  } catch (e) {
    console.error("Global Payment Error:", e);
    alert("Could not initiate payment. Try restarting Pi Browser.");
  }
};
