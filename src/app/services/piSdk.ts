/**
 * Pi SDK Service - Unified wrapper for Pi Network SDK
 * Implements Pi Network authentication with scopes for username, payments, and wallet_address
 */

export interface PiUser {
  uid: string;
  username: string;
  wallet_address?: string;
  accessToken?: string;
}

export function isPiBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isPiUA = /PiBrowser/i.test(navigator.userAgent);
  const hasPi = 'Pi' in window;
  
  return hasPi && isPiUA;
}

export function isPiSDKAvailable(): boolean {
  return typeof window !== 'undefined' && 'Pi' in window;
}

export async function initializePiSDK(): Promise<boolean> {
  if (!isPiSDKAvailable()) {
    console.warn('[PI SDK] SDK not available');
    return false;
  }
  
  const Pi = (window as any).Pi;
  try {
    await Pi.init({ version: '2.0', sandbox: false });
    console.log('[PI SDK] Initialized in Standard Mode');
    return true;
  } catch (error) {
    console.warn('[PI SDK] Standard Init failed, trying Sandbox...');
    try {
      await Pi.init({ version: '2.0', sandbox: true });
      console.log('[PI SDK] Initialized in Sandbox Mode');
      return true;
    } catch (e) {
      console.error('[PI SDK] Global Init Failure');
      return false;
    }
  }
}

export async function authenticateUser(scopes: string[] = ['username', 'payments', 'wallet_address']): Promise<PiUser> {
  if (!isPiBrowser()) {
    return { username: "Guest_Explorer", uid: "demo" };
  }

  const Pi = (window as any).Pi;

  try {
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    
    const user: PiUser = {
      uid: auth.user.uid,
      username: auth.user.username,
      wallet_address: auth.user.wallet_address,
      accessToken: auth.accessToken
    };
    
    console.log('[PI SDK] Authentication successful:', user.username);
    return user;
  } catch (error: any) {
    console.error('[PI SDK] Auth Failed:', error);
    throw error;
  }
}

export async function loginWithPi(): Promise<PiUser | null> {
  if (!isPiSDKAvailable()) {
    console.warn('[PI SDK] Please open this app in Pi Browser to login');
    return null;
  }

  try {
    const initialized = await initializePiSDK();
    if (!initialized) {
      throw new Error('Failed to initialize Pi SDK');
    }
    
    const user = await authenticateUser(['username', 'payments', 'wallet_address']);
    return user;
  } catch (error: any) {
    console.error('[PI SDK] Login failed:', error);
    return null;
  }
}

export async function verifyUserOnServer(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/verify-pi-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.verified === true;
    }
    return false;
  } catch (error) {
    console.warn('[PI SDK] Server verification failed:', error);
    return false;
  }
}

export function logout(): void {
  console.log('[PI SDK] User logged out');
}

function onIncompletePaymentFound(payment: any) {
  if (payment && payment.identifier) {
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paymentId: payment.identifier, 
        txid: payment.transaction?.txid, 
        action: 'complete' 
      })
    }).catch(err => console.error("Payment Recovery Failed", err));
  }
}

export async function loginWithPiAndLoadReputation(): Promise<{ user: PiUser | null; reputationLoaded: boolean }> {
  const user = await loginWithPi();
  
  if (user && user.uid !== 'demo') {
    try {
      const { reputationService } = await import('./reputationService');
      await reputationService.loadUserReputation(user.uid);
      localStorage.setItem('piUserId', user.uid);
      localStorage.setItem('piUsername', user.username);
      if (user.wallet_address) {
        localStorage.setItem('piWalletAddress', user.wallet_address);
      }
      return { user, reputationLoaded: true };
    } catch (error) {
      console.error('[PI SDK] Failed to load reputation:', error);
      return { user, reputationLoaded: false };
    }
  }
  
  return { user, reputationLoaded: false };
}
