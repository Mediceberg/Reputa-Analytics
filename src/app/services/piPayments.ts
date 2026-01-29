import { isPiBrowser, waitForPiSDK, initializePiSDK } from './piSdk';

interface PiPaymentSDK {
  init?: (options: { version: string; sandbox?: boolean }) => Promise<void>;
  authenticate?: (scopes: string[], onIncomplete: (payment: any) => void) => Promise<{ user: { uid: string; username: string } }>;
  createPayment: (config: any, callbacks: any) => Promise<{ identifier: string } | void>;
}

declare global {
  interface Window {
    Pi?: PiPaymentSDK;
  }
}

export async function createVIPPayment(uid: string, onSuccess: () => void) {
  if (!isPiBrowser()) {
    alert("Please open this app in Pi Browser to make payments");
    return;
  }
  
  const sdkReady = await waitForPiSDK(5000);
  if (!sdkReady || !window.Pi) {
    alert("Pi SDK is not available. Please refresh the page.");
    return;
  }

  try {
    await initializePiSDK();
    
    console.log('[Payment] Creating VIP payment for UID:', uid);
    
    await window.Pi.createPayment({
      amount: 1, 
      memo: "Reputa Score VIP Access",
      metadata: { uid, plan: "vip" },
    }, {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log('[Payment] Ready for server approval:', paymentId);
        try {
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, action: 'approve', uid }),
          });
          const data = await res.json();
          console.log('[Payment] Server approval response:', data);
          if (!res.ok) {
            console.error('[Payment] Server approval failed:', data);
          }
        } catch (err) {
          console.error('[Payment] Server approval error:', err);
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log('[Payment] Ready for completion:', paymentId, 'TxID:', txid);
        try {
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid, action: 'complete', uid }),
          });

          const data = await res.json();
          console.log('[Payment] Completion response:', data);
          
          if (res.ok && data.success) {
            alert("✅ VIP Payment Successful!\nPayment ID: " + paymentId + "\nTxID: " + txid);
            onSuccess();
          } else {
            alert("❌ Payment completion failed: " + (data.error || 'Unknown error'));
          }
        } catch (err: any) {
          console.error('[Payment] Completion error:', err);
          alert("❌ Payment completion error: " + err.message);
        }
      },

      onCancel: (paymentId: string) => {
        console.log('[Payment] Cancelled:', paymentId);
        alert("Payment cancelled");
      },

      onError: (error: any, paymentId?: string) => {
        console.error('[Payment] SDK Error:', error, paymentId);
        alert("Payment error: " + (error.message || JSON.stringify(error)));
      },
    });
  } catch (err: any) {
    console.error('[Payment] Create payment error:', err);
    alert("Payment failed: " + err.message);
  }
}
