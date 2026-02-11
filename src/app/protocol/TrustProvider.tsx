import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { reputationService } from '../services/reputationService';

interface TrustContextType {
  miningDays: number;
  trustScore: number;
  isDemo: boolean;
  walletData: any;
  updateMiningDays: (image: File) => Promise<void>;
  toggleDemo: () => void;
  refreshWallet: (address: string) => Promise<void>;
}

const TrustContext = createContext<TrustContextType | undefined>(undefined);

export const TrustProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [miningDays, setMiningDays] = useState(0);
  const [trustScore, setTrustScore] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  // Keep trust score synced from unified ReputationAtomic pipeline only.
  useEffect(() => {
    const unsubscribe = reputationService.subscribeUnifiedScore((score) => {
      setTrustScore(score.totalScore || 0);
    });

    return unsubscribe;
  }, []);

  const updateMiningDays = useCallback(async (_image: File) => {
    console.log('Processing Pi Mining Screenshot...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Keep miningDays behavior for UI, but do not calculate reputation here.
    const extractedDays = Math.floor(Math.random() * 500) + 1000;
    setMiningDays(extractedDays);
  }, []);

  // Refresh wallet data from Testnet (no local score calculation)
  const refreshWallet = useCallback(async (address: string) => {
    try {
      const response = await fetch(`https://api.testnet.minepi.com/accounts/${address}`);
      if (response.ok) {
        const data = await response.json();
        const balance = data.balances?.find((b: any) => b.asset_type === 'native');

        setWalletData({
          address,
          balance: balance ? parseFloat(balance.balance) : 0,
          externalFlow: 0,
        });
      }
    } catch (error) {
      console.error('Wallet refresh failed:', error);
    }
  }, []);

  const toggleDemo = useCallback(() => {
    setIsDemo((prev) => !prev);
  }, []);

  return (
    <TrustContext.Provider
      value={{
        miningDays,
        trustScore,
        isDemo,
        walletData,
        updateMiningDays,
        toggleDemo,
        refreshWallet,
      }}
    >
      {children}
    </TrustContext.Provider>
  );
};

export const useTrust = () => {
  const context = useContext(TrustContext);
  if (!context) throw new Error('useTrust must be used within TrustProvider');
  return context;
};
