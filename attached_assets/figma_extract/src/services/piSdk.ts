import { User, Payment } from '@/types';

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{ accessToken: string; user: { uid: string; username: string } }>;
      createPayment: (payment: Payment, callbacks: {
        onReadyForServerApproval: (paymentId: string) => void;
        onReadyForServerCompletion: (paymentId: string, txid: string) => void;
        onCancel: (paymentId: string) => void;
        onError: (error: Error, payment?: any) => void;
      }) => void;
      openShareDialog: (title: string, message: string) => void;
    };
  }
}

export class PiSdkWrapper {
  private initialized = false;

  init() {
    if (typeof window !== 'undefined' && window.Pi && !this.initialized) {
      window.Pi.init({
        version: '2.0',
        sandbox: true, // Use sandbox for testnet
      });
      this.initialized = true;
    }
  }

  async authenticate(onIncompletePaymentFound?: (payment: any) => void): Promise<User | null> {
    if (typeof window === 'undefined' || !window.Pi) {
      console.warn('Pi SDK not available');
      return null;
    }

    try {
      const scopes = ['username', 'payments', 'wallet_address'];
      const auth = await window.Pi.authenticate(
        scopes,
        onIncompletePaymentFound || (() => {})
      );

      return {
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken,
      };
    } catch (error) {
      console.error('Pi authentication error:', error);
      return null;
    }
  }

  createPayment(
    payment: Payment,
    callbacks: {
      onApprove: (paymentId: string) => void;
      onComplete: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error) => void;
    }
  ) {
    if (typeof window === 'undefined' || !window.Pi) {
      console.warn('Pi SDK not available');
      callbacks.onError(new Error('Pi SDK not available'));
      return;
    }

    window.Pi.createPayment(payment, {
      onReadyForServerApproval: callbacks.onApprove,
      onReadyForServerCompletion: callbacks.onComplete,
      onCancel: callbacks.onCancel,
      onError: callbacks.onError,
    });
  }

  openShareDialog(title: string, message: string) {
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.openShareDialog(title, message);
    }
  }
}

export const piSdk = new PiSdkWrapper();
