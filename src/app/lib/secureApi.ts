/**
 * Secure API utilities for sanitizing responses and protecting sensitive data
 */

export interface SanitizedDocument {
  id: string;
  title: string;
  totalPages: number;
  totalWords: number;
  sections: Array<{
    id: string;
    title: string;
    level: number;
    wordCount: number;
    isExamRelevant: boolean;
  }>;
  metadata: {
    author: string;
    subject: string;
    course: string;
    uploadedAt: string;
    processedAt: string;
  };
}

export interface SanitizedStudyPack {
  id: string;
  title: string;
  summary: {
    totalTopics: number;
    totalFlashcards: number;
    totalQuestions: number;
    estimatedStudyTime: number;
    difficulty: string;
  };
  generatedAt: string;
}

export interface SanitizedApiResponse {
  success: boolean;
  document?: SanitizedDocument;
  studyPack?: SanitizedStudyPack;
  message: string;
  error?: string;
}

/**
 * Sanitize document data for client consumption
 */
export function sanitizeDocument(document: any): SanitizedDocument {
  return {
    id: document.id || '',
    title: document.title || 'Untitled Document',
    totalPages: document.totalPages || 0,
    totalWords: document.totalWords || 0,
    sections: (document.sections || []).map((section: any) => ({
      id: section.id || '',
      title: section.title || 'Untitled Section',
      level: section.level || 1,
      wordCount: section.wordCount || 0,
      isExamRelevant: section.isExamRelevant || false
    })),
    metadata: {
      author: document.metadata?.author || 'Unknown',
      subject: document.metadata?.subject || 'General',
      course: document.metadata?.course || 'General',
      uploadedAt: document.metadata?.uploadedAt || new Date().toISOString(),
      processedAt: document.metadata?.processedAt || new Date().toISOString()
    }
  };
}

/**
 * Sanitize study pack data for client consumption
 */
export function sanitizeStudyPack(studyPack: any): SanitizedStudyPack {
  return {
    id: studyPack.id || '',
    title: studyPack.title || 'Untitled Study Pack',
    summary: {
      totalTopics: studyPack.summary?.totalTopics || 0,
      totalFlashcards: studyPack.summary?.totalFlashcards || 0,
      totalQuestions: studyPack.summary?.totalQuestions || 0,
      estimatedStudyTime: studyPack.summary?.estimatedStudyTime || 0,
      difficulty: studyPack.summary?.difficulty || 'medium'
    },
    generatedAt: studyPack.generatedAt || new Date().toISOString()
  };
}

/**
 * Create a secure API response
 */
export function createSecureResponse(
  success: boolean,
  data?: { document?: any; studyPack?: any },
  message: string = 'Operation completed',
  error?: string
): SanitizedApiResponse {
  const response: SanitizedApiResponse = {
    success,
    message
  };

  if (success && data) {
    if (data.document) {
      response.document = sanitizeDocument(data.document);
    }
    if (data.studyPack) {
      response.studyPack = sanitizeStudyPack(data.studyPack);
    }
  }

  if (error) {
    response.error = error;
  }

  return response;
}

/**
 * Log sensitive information only in development
 */
export function secureLog(message: string, data?: any): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SECURE] ${message}`, data);
  }
}

/**
 * Log errors with sanitized information
 */
export function secureErrorLog(message: string, error: any): void {
  const sanitizedError = {
    message: error?.message || 'Unknown error',
    stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    timestamp: new Date().toISOString()
  };

  console.error(`[SECURE ERROR] ${message}`, sanitizedError);
}

/**
 * Validate and sanitize file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 4.5 * 1024 * 1024; // 4.5MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 4.5MB.'
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'
    };
  }

  return { valid: true };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...validRequests);
    return oldestRequest + this.windowMs;
  }
}

/**
 * Content Security Policy headers
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com",
    "frame-ancestors 'none'"
  ].join('; ')
};

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey) return false;
  
  // Basic format validation for OpenAI API key
  const openaiKeyPattern = /^sk-[a-zA-Z0-9]{48}$/;
  return openaiKeyPattern.test(apiKey);
}

/**
 * Generate secure random ID
 */
export function generateSecureId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`;
}
