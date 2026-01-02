/**
 * Transactions Module - Analyze and score each transaction
 */

import type { Transaction, TransactionScore } from './types';

/**
 * Analyze a single transaction and calculate its score
 */
export function analyzeTransaction(transaction: Transaction): TransactionScore {
  let basePoints = 5;
  let typeBonus = 0;
  let sizeBonus = 0;
  let suspiciousPenalty = 0;
  let explanation = '';
  
  // Type-based scoring
  if (transaction.type === 'internal') {
    typeBonus = 10;
    explanation = 'Internal Pi Network transaction: +10';
  } else {
    typeBonus = -15;
    explanation = 'External transaction (exchange/platform): -15';
  }
  
  // Size-based scoring
  if (transaction.amount > 100) {
    sizeBonus = 5;
    explanation += ', Large amount: +5';
  } else if (transaction.amount < 1) {
    suspiciousPenalty = -3;
    explanation += ', Micro transaction: -3';
  }
  
  // Suspicious pattern detection
  if (isSuspicious(transaction)) {
    suspiciousPenalty -= 10;
    explanation += ', Flagged as suspicious: -10';
  }
  
  const totalPoints = basePoints + typeBonus + sizeBonus + suspiciousPenalty;
  
  const score: TransactionScore = {
    basePoints,
    typeBonus,
    sizeBonus,
    suspiciousPenalty,
    totalPoints,
    explanation: `Base: +${basePoints}${explanation} = ${totalPoints} points`
  };
  
  transaction.score = score;
  return score;
}

/**
 * Analyze all transactions and return aggregated data
 */
export function analyzeAllTransactions(transactions: Transaction[]): {
  scores: TransactionScore[];
  totalScore: number;
  internalCount: number;
  externalCount: number;
  suspiciousCount: number;
} {
  const scores: TransactionScore[] = [];
  let totalScore = 0;
  let internalCount = 0;
  let externalCount = 0;
  let suspiciousCount = 0;
  
  transactions.forEach(tx => {
    const score = analyzeTransaction(tx);
    scores.push(score);
    totalScore += score.totalPoints;
    
    if (tx.type === 'internal') internalCount++;
    else externalCount++;
    
    if (score.suspiciousPenalty < 0) suspiciousCount++;
  });
  
  // Cap transaction score at 40 points
  const cappedScore = Math.min(Math.max(totalScore, 0), 40);
  
  return {
    scores,
    totalScore: cappedScore,
    internalCount,
    externalCount,
    suspiciousCount
  };
}

/**
 * Detect suspicious transaction patterns
 */
function isSuspicious(transaction: Transaction): boolean {
  // Very small amounts (dust attacks)
  if (transaction.amount < 0.1) return true;
  
  // Suspicious memo patterns
  if (transaction.memo && /scam|phishing|test/i.test(transaction.memo)) {
    return true;
  }
  
  // External + round numbers (potential bot)
  if (transaction.type === 'external' && 
      transaction.amount % 10 === 0 && 
      transaction.amount > 50) {
    return true;
  }
  
  return false;
}

/**
 * Get human-readable explanation for transaction score
 */
export function getTransactionExplanation(transaction: Transaction): string {
  if (!transaction.score) return 'Not analyzed';
  return transaction.score.explanation;
}

/**
 * Flag suspicious transactions for review
 */
export function flagSuspiciousTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(tx => 
    tx.score && tx.score.suspiciousPenalty < 0
  );
}
