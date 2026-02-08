/**
 * Middleware and Utilities for Reputation API v3.0
 */

import { Request, Response, NextFunction } from 'express';

// ====================
// VALIDATION MIDDLEWARE
// ====================

/**
 * Validate user identity parameters
 */
export function validateUserParams(req: Request, res: Response, next: NextFunction) {
  const { pioneerId, username, email } = req.query;
  const errors: string[] = [];
  
  if (!pioneerId) errors.push('pioneerId (query param)');
  if (!username) errors.push('username (query param)');
  if (!email) errors.push('email (query param)');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: ' + errors.join(', '),
      example: '/api/v3/reputation?pioneerId=user123&username=john&email=john@example.com'
    });
  }
  
  // Validate format
  if (typeof pioneerId !== 'string' || pioneerId.length < 1) {
    return res.status(400).json({ success: false, error: 'Invalid pioneerId format' });
  }
  
  if (typeof username !== 'string' || username.length < 1) {
    return res.status(400).json({ success: false, error: 'Invalid username format' });
  }
  
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }
  
  next();
}

/**
 * Validate reputation points (0-100000)
 */
export function validatePoints(points: any): { valid: boolean; error?: string; value?: number } {
  const numPoints = Number(points);
  
  if (isNaN(numPoints)) {
    return { valid: false, error: 'Points must be a number' };
  }
  
  if (numPoints < 0 || numPoints > 100000) {
    return { valid: false, error: 'Points must be between 0 and 100000' };
  }
  
  return { valid: true, value: Math.floor(numPoints) };
}

/**
 * Validate level (1-20)
 */
export function validateLevel(level: any): { valid: boolean; error?: string; value?: number } {
  const numLevel = Number(level);
  
  if (isNaN(numLevel)) {
    return { valid: false, error: 'Level must be a number' };
  }
  
  if (numLevel < 1 || numLevel > 20) {
    return { valid: false, error: 'Level must be between 1 and 20' };
  }
  
  return { valid: true, value: Math.floor(numLevel) };
}

// ====================
// ERROR HANDLING
// ====================

export class ReputationError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ReputationError';
  }
}

export function handleReputationError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ReputationError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details
    });
  }
  
  // MongoDB errors
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  // Generic error
  console.error(err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { debug: err.message })
  });
}

// ====================
// RESPONSE FORMATTING
// ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export function formatSuccess<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString()
  };
}

export function formatError(error: string, details?: any): {
  success: boolean;
  error: string;
  details?: any;
  timestamp: string;
} {
  return {
    success: false,
    error,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  };
}

// ====================
// LOGGING
// ====================

export function logRequest(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;
    
    console.log(
      `[${new Date().toISOString()}] ${method} ${path} ${status} (${duration}ms)`
    );
  });
  
  next();
}

// ====================
// RATE LIMITING
// ====================

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function simpleRateLimit(
  windowMs: number = 60000,    // 1 minute
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    let record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestCounts.set(key, record);
      next();
      return;
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    next();
  };
}

// ====================
// CACHING HELPERS
// ====================

export function setCacheHeader(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Cache GET requests for 5 minutes
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
}

// ====================
// JSON SERIALIZATION
// ====================

export function serializeReputationData(data: any) {
  return {
    ...data,
    // Convert Dates to ISO strings
    createdAt: data.createdAt?.toISOString?.() || data.createdAt,
    updatedAt: data.updatedAt?.toISOString?.() || data.updatedAt,
    lastActivityDate: data.lastActivityDate?.toISOString?.() || data.lastActivityDate
  };
}

// ====================
// PAGINATION
// ====================

export function getPaginationParams(req: Request): { limit: number; skip: number } {
  let limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  let skip = Math.max(parseInt(req.query.skip as string) || 0, 0);
  
  // Ensure valid values
  if (limit < 1) limit = 100;
  if (skip < 0) skip = 0;
  
  return { limit, skip };
}

// ====================
// EXPORTS
// ====================

export default {
  validateUserParams,
  validatePoints,
  validateLevel,
  ReputationError,
  handleReputationError,
  formatSuccess,
  formatError,
  logRequest,
  simpleRateLimit,
  setCacheHeader,
  serializeReputationData,
  getPaginationParams
};
