/**
 * Image Verification Module - Validate uploaded images
 */

import type { Alert } from './types';

/**
 * Verify image file before processing
 */
export async function verifyImage(
  file: File,
  maxSizeMB: number = 10
): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP.'
    };
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File too large (${sizeMB.toFixed(2)}MB). Maximum ${maxSizeMB}MB.`
    };
  }
  
  // Check dimensions
  const dimensions = await getImageDimensions(file);
  if (dimensions.width < 300 || dimensions.height < 300) {
    return {
      valid: false,
      error: 'Image resolution too low. Minimum 300x300 pixels.'
    };
  }
  
  return { valid: true };
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Create alert for image upload result
 */
export function createImageAlert(
  success: boolean,
  message: string,
  details?: string
): Alert {
  return {
    type: success ? 'success' : 'error',
    message,
    timestamp: new Date(),
    details
  };
}
