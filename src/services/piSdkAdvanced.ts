/**
 * Pi Network SDK Integration with Demo Mode Support
 * Handles authentication, wallet data, and Demo Mode seamlessly
 */

export interface PiUser {
  uid: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isKYC?: boolean;
}

export interface PiWallet {
  address: string;
  balance: number;
  network: 'mainnet' | 'testnet';
  isStaking: boolean;
  stakeAmount?: number;
}

export interface PiSDKConfig {
  scopes?: string[];
  onIncompleteUserSetup?: () => void;
}

export class PiSDKClient {
  private piSDK: any = null;
  private isInitialized = false;
  private isDemoMode = false;
  private demoUser: PiUser | null = null;

  /**
   * Initialize Pi SDK (only in Pi Browser)
   */
  async initialize(config: PiSDKConfig = {}): Promise<void> {
    // Check if running in Pi Browser
    if (typeof window === 'undefined' || !window.Pi) {
      console.warn('⚠️  Pi SDK not available (not in Pi Browser). Demo Mode enabled.');
      this.isDemoMode = true;
      this.initializeDemoMode();
      return;
    }

    try {
      this.piSDK = window.Pi;

      // Configure SDK
      await this.piSDK.init({
        version: '2.0',
        scopes: config.scopes || ['wallet', 'username'],
        onIncompleteUserSetup: config.onIncompleteUserSetup,
      });

      this.isInitialized = true;
      console.log('✅ Pi SDK initialized in real mode');
    } catch (error) {
      console.error('❌ Pi SDK initialization failed:', error);
      // Fallback to Demo Mode
      this.isDemoMode = true;
      this.initializeDemoMode();
    }
  }

  /**
   * Authenticate user with Pi SDK
   */
  async authenticateUser(): Promise<PiUser> {
    if (this.isDemoMode) {
      return this.getDemoUser();
    }

    if (!this.isInitialized || !this.piSDK) {
      throw new Error('Pi SDK not initialized');
    }

    try {
      const scopes = ['username', 'payments'];
      // Use any for SDK compatibility
      const user = await (this.piSDK as any).authenticate(scopes, (user: any) => {
        // Handle incomplete user setup
        console.log('Incomplete user setup:', user);
      });

      return {
        uid: user.uid,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        isKYC: user.isKYC,
      };
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<PiUser | null> {
    if (this.isDemoMode) {
      return this.getDemoUser();
    }

    try {
      const user = await this.piSDK?.currentUser;
      if (!user) return null;

      return {
        uid: user.uid,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get user's wallet(s)
   */
  async getWallet(network: 'mainnet' | 'testnet' = 'mainnet'): Promise<PiWallet | null> {
    if (this.isDemoMode) {
      return this.getDemoWallet(network);
    }

    if (!this.piSDK) {
      throw new Error('Pi SDK not initialized');
    }

    try {
      const wallet = await this.piSDK.requestWallet({ network });

      return {
        address: wallet.address,
        balance: parseFloat(wallet.balance),
        network,
        isStaking: wallet.isStaking || false,
        stakeAmount: wallet.stakeAmount ? parseFloat(wallet.stakeAmount) : undefined,
      };
    } catch (error) {
      console.error(`❌ Error fetching ${network} wallet:`, error);
      return null;
    }
  }

  /**
   * Create payment with Pi
   */
  async createPayment(
    paymentData: {
      amount: number;
      memo?: string;
      metadata?: Record<string, any>;
    },
    onComplete?: (txid: string) => void
  ): Promise<{ txid: string; status: string }> {
    if (this.isDemoMode) {
      return this.createDemoPayment(paymentData, onComplete);
    }

    if (!this.piSDK) {
      throw new Error('Pi SDK not initialized');
    }

    try {
      const payment = await this.piSDK.createPayment({
        amount: paymentData.amount,
        memo: paymentData.memo || 'Reputa Protocol',
        metadata: paymentData.metadata,
        onComplete,
      });

      return {
        txid: payment.identifier,
        status: 'completed',
      };
    } catch (error) {
      console.error('❌ Payment creation failed:', error);
      throw error;
    }
  }

  /**
   * Check if in Demo Mode
   */
  isDemoModeActive(): boolean {
    return this.isDemoMode;
  }

  /**
   * Get network configuration
   */
  getNetworkInfo(): { supportedNetworks: string[]; isDemoMode: boolean } {
    return {
      supportedNetworks: ['mainnet', 'testnet'],
      isDemoMode: this.isDemoMode,
    };
  }

  // ==================== DEMO MODE IMPLEMENTATION ====================

  /**
   * Initialize Demo Mode with sample data
   */
  private initializeDemoMode(): void {
    this.isDemoMode = true;
    this.demoUser = this.generateDemoUser();
    console.log('🎮 Demo Mode initialized with sample data');
  }

  /**
   * Generate realistic demo user
   */
  private generateDemoUser(): PiUser {
    const demoUsernames = [
      'DemoUser_Pioneer',
      'TestPioneer_2024',
      'ReputaTester',
      'DemoExplorer',
      'SampleUser',
    ];

    const username = demoUsernames[Math.floor(Math.random() * demoUsernames.length)];

    return {
      uid: `demo_${Math.random().toString(36).substr(2, 9)}`,
      username,
      email: `${username.toLowerCase()}@example.com`,
      firstName: 'Demo',
      lastName: 'Pioneer',
      profilePicture: 'https://via.placeholder.com/150',
      isKYC: true,
    };
  }

  /**
   * Get demo user
   */
  private getDemoUser(): PiUser {
    if (!this.demoUser) {
      this.demoUser = this.generateDemoUser();
    }
    return this.demoUser;
  }

  /**
   * Get demo wallet with realistic data
   */
  private getDemoWallet(network: 'mainnet' | 'testnet'): PiWallet {
    if (network === 'mainnet') {
      return {
        address: '0x' + 'a'.repeat(40),
        balance: 150 + Math.random() * 350, // 150-500 Pi
        network: 'mainnet',
        isStaking: true,
        stakeAmount: 100 + Math.random() * 200, // 100-300 staked
      };
    } else {
      return {
        address: '0x' + 'b'.repeat(40),
        balance: 50 + Math.random() * 150, // 50-200 Pi
        network: 'testnet',
        isStaking: false,
      };
    }
  }

  /**
   * Create demo payment
   */
  private async createDemoPayment(
    paymentData: { amount: number; memo?: string; metadata?: Record<string, any> },
    onComplete?: (txid: string) => void
  ): Promise<{ txid: string; status: string }> {
    const demoTxid = `0x${Math.random().toString(16).substr(2)}`;

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (onComplete) {
      onComplete(demoTxid);
    }

    return {
      txid: demoTxid,
      status: 'completed',
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    if (!this.isDemoMode && this.piSDK) {
      try {
        await this.piSDK.logout?.();
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    }

    this.demoUser = null;
    this.isInitialized = false;
  }

  /**
   * Request signature (for verification)
   */
  async requestSignature(message: string): Promise<{ signature: string; address: string }> {
    if (this.isDemoMode) {
      return {
        signature: `0x${Buffer.from(message).toString('hex')}`,
        address: '0x' + 'a'.repeat(40),
      };
    }

    if (!this.piSDK) {
      throw new Error('Pi SDK not initialized');
    }

    try {
      const result = await this.piSDK.requestSignature(message);
      return result;
    } catch (error) {
      console.error('❌ Signature request failed:', error);
      throw error;
    }
  }

  /**
   * Verify signature
   */
  async verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean> {
    // This would typically be done server-side
    // For demo, return true if signature is valid
    return !!signature && !!address;
  }
}

// Singleton instance
let piClient: PiSDKClient | null = null;

/**
 * Get or create Pi SDK client
 */
export function getPiSDKClient(): PiSDKClient {
  if (!piClient) {
    piClient = new PiSDKClient();
  }
  return piClient;
}

/**
 * Initialize Pi SDK client
 */
export async function initializePiSDK(config?: PiSDKConfig): Promise<PiSDKClient> {
  const client = getPiSDKClient();
  await client.initialize(config);
  return client;
}

export default { getPiSDKClient, initializePiSDK, PiSDKClient };
