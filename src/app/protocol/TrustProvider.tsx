import React, { createContext, useContext, useState, useEffect } from 'react';
// استيراد الدوال من مجلد api الذي ظهر في صورك
import { getWalletData } from '../api/get-wallet'; 

interface TrustContextType {
  miningDays: number;
  trustScore: number;
  isDemo: boolean;
  walletData: any;
  updateMiningDays: (image: File) => void;
  toggleDemo: () => void;
}

const TrustContext = createContext<TrustContextType | undefined>(undefined);

export const TrustProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [miningDays, setMiningDays] = useState(0);
  const [trustScore, setTrustScore] = useState(0);
  const [isDemo, setIsDemo] = useState(true);
  const [walletData, setWalletData] = useState(null);

  // دالة استخراج الأيام من الصورة (OCR Logic)
  const updateMiningDays = async (image: File) => {
    console.log("Processing Pi Mining Screenshot...");
    // هنا يتم وضع كود OCR مستقبلاً، حالياً سنضع القيمة 1777 كبونيص أقدمية
    const extractedDays = 1777; 
    setMiningDays(extractedDays);
    calculateScore(extractedDays, walletData);
  };

  // معادلة الثقة التي تشجع على البقاء داخل نظام Pi
  const calculateScore = (days: number, wallet: any) => {
    let score = 50; // نقطة البداية
    if (days > 1000) score += 30; // بونيص الأقدمية
    // تقليل النقاط إذا كان هناك خروج للمنصات (بيانات من api/get-wallet)
    if (wallet?.externalFlow > 100) score -= 20; 
    setTrustScore(score);
  };

  return (
    <TrustContext.Provider value={{ miningDays, trustScore, isDemo, walletData, updateMiningDays, toggleDemo: () => setIsDemo(!isDemo) }}>
      {children}
    </TrustContext.Provider>
  );
};

export const useTrust = () => {
  const context = useContext(TrustContext);
  if (!context) throw new Error("useTrust must be used within TrustProvider");
  return context;
};
