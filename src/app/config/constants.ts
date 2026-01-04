/**
 * Application Constants
 * تم تعديلها لتتوافق مع الربط الحقيقي والحي لشبكة Pi 
 */

export const APP_CONFIG = {
  name: 'Reputa Score',
  version: '2.5.0',
  description: 'Advanced Pi Network wallet reputation analyzer',
  developer: {
    name: 'Reputa Analytics',
    email: 'support@reputa-analytics.com'
  }
};

export const PI_CONFIG = {
  // استخدام التست نت بشكل افتراضي لضمان الأمان أثناء التطوير
  network: (import.meta.env.VITE_PI_NETWORK || 'testnet') as 'testnet' | 'mainnet',
  
  // هام: الـ API Key لا يجب أن يُمرر للـ SDK في المتصفح. 
  // الـ SDK يحتاج فقط لـ App ID (اختياري في بعض النسخ) أو يتم التعامل معه عبر السيرفر.
  sdkVersion: '2.0'
};

export const SCORE_CONFIG = {
  maxWalletAgeScore: 20,
  maxTransactionScore: 40,
  maxStakingScore: 30,
  maxMiningBonus: 10,
  scale: 1000 // المقياس النهائي للسمعة (0-1000)
};

export const VIP_CONFIG = {
  price: 1, // سعر الاشتراك 1 Pi
  duration: 365, // عدد الأيام
  benefits: [
    'All transactions visible',
    'Detailed score breakdown',
    'Advanced analytics',
    'Mining bonus insights',
    'Export reports',
    'Priority support'
  ]
};

// إعداد مستويات الثقة مع الألوان المحددة للواجهة الرسومية
export const TRUST_LEVELS = {
  Elite: { min: 900, color: '#10b981', label: 'Elite' },
  High: { min: 700, color: '#3b82f6', label: 'High' },
  Medium: { min: 500, color: '#eab308', label: 'Medium' },
  Low: { min: 0, color: '#ef4444', label: 'Low' }
} as const;

// نقاط النهاية للـ API التي سيتصل بها التطبيق (Vercel Functions)
export const API_ENDPOINTS = {
  approve: '/api/approve',
  complete: '/api/complete',
  getWallet: '/api/get-wallet',
  auth: '/api/auth'
};

// مفاتيح التخزين المحلي لضمان استمرارية جلسة المستخدم وحالة الدفع
export const STORAGE_KEYS = {
  currentUser: 'reputa_current_user',
  vipStatus: (userId: string) => `vip_${userId}`,
  payment: (paymentId: string) => `payment_${paymentId}`,
  report: (walletAddress: string) => `report_${walletAddress}`
};
