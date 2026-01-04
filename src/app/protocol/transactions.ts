/**
 * Transactions Module - Analyze and score each transaction
 * تحديث: الربط مع معرفات البلوكشين الحقيقية لعام 2026
 */  

import type { Transaction, TransactionScore } from './types';

/**
 * تحليل معاملة واحدة وحساب نقاطها بناءً على معايير شبكة Pi
 */
export function analyzeTransaction(transaction: Transaction): TransactionScore {
  let basePoints = 5;
  let typeBonus = 0;
  let sizeBonus = 0;
  let suspiciousPenalty = 0;
  let explanation = '';
  
  // منطق التمييز بين المعاملات الداخلية (تطبيقات Pi) والخارجية
  // في النسخة الحقيقية، نعتبر المعاملة internal إذا كانت مرتبطة بـ App ID معروف
  if (transaction.type === 'internal' || transaction.memo?.includes('app')) {
    typeBonus = 10;
    explanation = 'Verified App Transaction: +10';
  } else {
    // المعاملات المجهولة أو خارج نظام التطبيقات تأخذ تقييماً أقل لضمان الأمان
    typeBonus = -5; 
    explanation = 'Standard P2P Transfer: -5';
  }
  
  // التقييم بناءً على الكمية (Size-based)
  if (transaction.amount > 500) {
    sizeBonus = 10;
    explanation += ', High Volume: +10';
  } else if (transaction.amount < 0.01) {
    suspiciousPenalty = -5;
    explanation += ', Dust/Micro-tx: -5';
  }
  
  // كشف الأنماط المشبوهة (Suspicious pattern detection)
  if (isSuspicious(transaction)) {
    suspiciousPenalty -= 15;
    explanation += ', Flagged Pattern: -15';
  }
  
  const totalPoints = basePoints + typeBonus + sizeBonus + suspiciousPenalty;
  
  const score: TransactionScore = {
    basePoints,
    typeBonus,
    sizeBonus,
    suspiciousPenalty,
    totalPoints,
    explanation: `Base: +${basePoints} | ${explanation} | Final: ${totalPoints}`
  };
  
  transaction.score = score;
  return score;
}

/**
 * تحليل جميع المعاملات وجمع البيانات للتقرير النهائي
 */
export function analyzeAllTransactions(transactions: Transaction[]): {
  scores: TransactionScore[];
  totalScore: number;
  internalCount: number;
  externalCount: number;
  suspiciousCount: number;
} {
  const scores: TransactionScore[] = [];
  let cumulativeScore = 0;
  let internalCount = 0;
  let externalCount = 0;
  let suspiciousCount = 0;
  
  // في البلوكشين الحقيقي قد لا توجد معاملات، نتعامل مع المصفوفة الفارغة
  if (!transactions || transactions.length === 0) {
    return { scores: [], totalScore: 0, internalCount: 0, externalCount: 0, suspiciousCount: 0 };
  }

  transactions.forEach(tx => {
    const score = analyzeTransaction(tx);
    scores.push(score);
    cumulativeScore += score.totalPoints;
    
    if (tx.type === 'internal') internalCount++;
    else externalCount++;
    
    if (score.suspiciousPenalty < 0) suspiciousCount++;
  });
  
  // تحديد سقف النقاط بـ 40 كما في إعداداتك الأصلية SCORE_CONFIG
  const cappedScore = Math.min(Math.max(cumulativeScore, 0), 40);
  
  return {
    scores,
    totalScore: cappedScore,
    internalCount,
    externalCount,
    suspiciousCount
  };
}

/**
 * كشف الأنماط المشبوهة حقيقياً
 * 
 */
function isSuspicious(transaction: Transaction): boolean {
  // 1. مبالغ متكررة جداً وصغيرة (Spam)
  if (transaction.amount <= 0.001) return true;
  
  // 2. الكلمات الدلالية للاحتيال في الـ Memo
  const suspiciousKeywords = /scam|phishing|gift|win|prize|airdrop/i;
  if (transaction.memo && suspiciousKeywords.test(transaction.memo)) {
    return true;
  }
  
  // 3. معاملات ضخمة دائرية (Circular transactions)
  // إذا كان المرسل هو نفسه المستلم (تحدث أحياناً في الاختبار)
  if (transaction.from === transaction.to) return true;
  
  return false;
}

export function getTransactionExplanation(transaction: Transaction): string {
  return transaction.score ? transaction.score.explanation : 'Transaction awaiting analysis...';
}

export function flagSuspiciousTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(tx => 
    tx.score && tx.score.suspiciousPenalty < -5
  );
}
