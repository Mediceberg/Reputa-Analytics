/**
 * Mining Module - OCR and mining bonus calculation
 */

import type { MiningData, YearWithPiImage } from './types';
 
/**
 * Process "Year with Pi" image and extract mining data
 */
export async function processYearWithPiImage(
  imageFile: File,
  walletCreationDate: Date
): Promise<YearWithPiImage> {
  try {
    const imageData = await fileToBase64(imageFile);
    const extractedData = await extractMiningData(imageData, walletCreationDate);
    
    return {
      imageData,
      uploadedAt: new Date(),
      verified: extractedData.verificationStatus === 'verified',
      extractedData
    };
  } catch (error) {
    console.error('[MINING] Processing failed:', error);
    throw error;
  }
}

/**
 * Extract mining data using OCR (mock implementation)
 * In production: use Tesseract.js or cloud OCR service
 */
async function extractMiningData(
  imageData: string,
  walletCreationDate: Date
): Promise<MiningData> {
  // Simulate OCR processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock extracted data
  const mockData: MiningData = {
    totalDays: Math.floor(Math.random() * 300) + 100,
    sessionsPerDay: parseFloat((Math.random() * 2 + 1).toFixed(1)),
    piEarned: parseFloat((Math.random() * 500 + 100).toFixed(2)),
    absenceDays: Math.floor(Math.random() * 50),
    verificationStatus: 'verified',
    score: 0,
    explanation: ''
  };
  
  return verifyMiningData(mockData, walletCreationDate);
}

/**
 * Verify mining data against wallet creation date
 */
function verifyMiningData(
  miningData: MiningData,
  walletCreationDate: Date
): MiningData {
  const accountAgeDays = Math.floor(
    (Date.now() - walletCreationDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Check if mining days exceed account age (fraud detection)
  if (miningData.totalDays > accountAgeDays + 30) {
    miningData.verificationStatus = 'suspicious';
    miningData.score = 0;
    miningData.explanation = `Mining days (${miningData.totalDays}) exceed account age (${accountAgeDays}). Possible forgery.`;
    return miningData;
  }
  
  // Calculate mining score (max 10 bonus points)
  let score = 0;
  let explanation = '';
  
  // Total days score (up to 5 points)
  if (miningData.totalDays >= 300) {
    score += 5;
    explanation = 'Elite miner (300+ days): +5';
  } else if (miningData.totalDays >= 200) {
    score += 4;
    explanation = 'Dedicated miner (200-299 days): +4';
  } else if (miningData.totalDays >= 100) {
    score += 3;
    explanation = 'Active miner (100-199 days): +3';
  } else {
    score += 1;
    explanation = 'Casual miner: +1';
  }
  
  // Sessions per day score (up to 3 points)
  if (miningData.sessionsPerDay >= 3) {
    score += 3;
    explanation += ', High engagement (3+ sessions): +3';
  } else if (miningData.sessionsPerDay >= 2) {
    score += 2;
    explanation += ', Good engagement (2+ sessions): +2';
  } else {
    score += 1;
    explanation += ', Basic engagement: +1';
  }
  
  // Absence penalty (up to -2 points)
  const absenceRate = miningData.absenceDays / miningData.totalDays;
  if (absenceRate > 0.3) {
    score -= 2;
    explanation += ', High absence (>30%): -2';
  } else if (absenceRate > 0.15) {
    score -= 1;
    explanation += ', Moderate absence (15-30%): -1';
  }
  
  score = Math.min(Math.max(score, 0), 10);
  
  miningData.score = score;
  miningData.explanation = explanation;
  miningData.verificationStatus = 'verified';
  
  return miningData;
}

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate mining consistency percentage
 */
export function calculateMiningConsistency(miningData: MiningData): number {
  return Math.round((1 - (miningData.absenceDays / miningData.totalDays)) * 100);
}
