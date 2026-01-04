import React, { createContext, useContext, useState, useCallback } from 'react';

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

  // OCR simulation for mining image
  const updateMiningDays = useCallback(async (image: File) => {
    console.log("Processing Pi Mining Screenshot...");
    
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract days (mock - in production use Tesseract.js)
    const extractedDays = Math.floor(Math.random() * 500) + 1000;
    setMiningDays(extractedDays);
    
    // Recalculate score
    calculateScore(extractedDays, walletData);
  }, [walletData]);

  // Trust score calculation
  const calculateScore = useCallback((days: number, wallet: any) => {
    let score = 500; // Base score
    
    // Mining days bonus
    if (days > 1000) score += 100;
    else if (days > 500) score += 50;
    
    // Wallet balance bonus
    if (wallet?.balance > 100) score += 50;
    
    // Transaction penalty for external flows
    if (wallet?.externalFlow > 50) score -= 50;
    
    setTrustScore(Math.min(1000, Math.max(0, score)));
  }, []);

  // Refresh wallet data from Testnet
  const refreshWallet = useCallback(async (address: string) => {
    try {
      const response = await fetch(`https://api.testnet.minepi.com/accounts/${address}`);
      if (response.ok) {
        const data = await response.json();
        const balance = data.balances?.find((b: any) => b.asset_type === 'native');
        
        const wallet = {
          address,
          balance: balance ? parseFloat(balance.balance) : 0,
          externalFlow: 0
        };
        
        setWalletData(wallet);
        calculateScore(miningDays, wallet);
      }
    } catch (error) {
      console.error('Wallet refresh failed:', error);
    }
  }, [miningDays, calculateScore]);

  const toggleDemo = useCallback(() => {
    setIsDemo(prev => !prev);
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
        refreshWallet
      }}
    >
      {children}
    </TrustContext.Provider>
  );
};

export const useTrust = () => {
  const context = useContext(TrustContext);
  if (!context) throw new Error("useTrust must be used within TrustProvider");
  return context;
};
