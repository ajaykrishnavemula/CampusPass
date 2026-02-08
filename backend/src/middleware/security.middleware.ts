import { FastifyRequest, FastifyReply } from 'fastify';
import { validateObjectId } from '../utils/validators';

/**
 * Rate limiting map for scan endpoints
 * Tracks requests per security user
 */
const scanRateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * QR Code validation middleware
 * Validates QR code format and basic checks
 */
export const validateQRCode = async (
  request: FastifyRequest<{ Body: { qrCode?: string } }>,
  reply: FastifyReply
) => {
  const { qrCode } = request.body;

  if (!qrCode) {
    return reply.status(400).send({
      success: false,
      message: 'QR code is required',
    });
  }

  if (typeof qrCode !== 'string') {
    return reply.status(400).send({
      success: false,
      message: 'QR code must be a string',
    });
  }

  if (qrCode.trim().length === 0) {
    return reply.status(400).send({
      success: false,
      message: 'QR code cannot be empty',
    });
  }

  // Check for minimum length (QR codes are typically longer)
  if (qrCode.length < 10) {
    return reply.status(400).send({
      success: false,
      message: 'Invalid QR code format',
    });
  }

  // Check for suspicious patterns (basic tampering detection)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(qrCode)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid QR code - suspicious content detected',
      });
    }
  }
};

/**
 * Rate limiting middleware for scan endpoints
 * Prevents spam and abuse
 * Limit: 30 scans per minute per security user
 */
export const rateLimitScan = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user as any;
  const userId = user?.id;

  if (!userId) {
    return reply.status(401).send({
      success: false,
      message: 'Unauthorized',
    });
  }

  const now = Date.now();
  const limit = 30; // 30 requests per minute
  const windowMs = 60 * 1000; // 1 minute

  const userLimit = scanRateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    scanRateLimitMap.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (userLimit.count >= limit) {
    return reply.status(429).send({
      success: false,
      message: 'Too many scan requests. Please wait before trying again.',
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
    });
  }

  // Increment count
  userLimit.count++;
  scanRateLimitMap.set(userId, userLimit);
};

/**
 * Validate check-out request body
 */
export const validateCheckOutRequest = async (
  request: FastifyRequest<{ Body: { outpassId?: string } }>,
  reply: FastifyReply
) => {
  const { outpassId } = request.body;

  if (!outpassId) {
    return reply.status(400).send({
      success: false,
      message: 'Outpass ID is required',
    });
  }

  if (!validateObjectId(outpassId)) {
    return reply.status(400).send({
      success: false,
      message: 'Invalid outpass ID format',
    });
  }
};

/**
 * Validate check-in request body
 */
export const validateCheckInRequest = async (
  request: FastifyRequest<{ Body: { outpassId?: string } }>,
  reply: FastifyReply
) => {
  const { outpassId } = request.body;

  if (!outpassId) {
    return reply.status(400).send({
      success: false,
      message: 'Outpass ID is required',
    });
  }

  if (!validateObjectId(outpassId)) {
    return reply.status(400).send({
      success: false,
      message: 'Invalid outpass ID format',
    });
  }
};

/**
 * Validate history query parameters
 */
export const validateHistoryQuery = async (
  request: FastifyRequest<{
    Querystring: {
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
      action?: string;
      result?: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { startDate, endDate, page, limit, action, result } = request.query;

  // Validate dates if provided
  if (startDate) {
    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid start date format',
      });
    }
  }

  if (endDate) {
    const date = new Date(endDate);
    if (isNaN(date.getTime())) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid end date format',
      });
    }
  }

  // Validate date range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return reply.status(400).send({
        success: false,
        message: 'End date must be after start date',
      });
    }
  }

  // Validate pagination
  if (page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return reply.status(400).send({
        success: false,
        message: 'Page must be a positive number',
      });
    }
  }

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return reply.status(400).send({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }
  }

  // Validate action type
  if (action) {
    const validActions = ['check_out', 'check_in', 'invalid_scan'];
    if (!validActions.includes(action)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid action type',
      });
    }
  }

  // Validate result type
  if (result) {
    const validResults = ['success', 'failed', 'overdue'];
    if (!validResults.includes(result)) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid result type',
      });
    }
  }
};

/**
 * Error handler for camera/network failures
 * Provides user-friendly error messages
 */
export const handleScanError = (error: any) => {
  // Camera permission denied
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return {
      success: false,
      message: 'Camera permission denied. Please allow camera access to scan QR codes.',
      errorType: 'CAMERA_PERMISSION_DENIED',
    };
  }

  // Camera not found
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return {
      success: false,
      message: 'No camera found. Please ensure your device has a working camera.',
      errorType: 'CAMERA_NOT_FOUND',
    };
  }

  // Camera in use
  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return {
      success: false,
      message: 'Camera is already in use by another application.',
      errorType: 'CAMERA_IN_USE',
    };
  }

  // Network error
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return {
      success: false,
      message: 'Network error. Please check your internet connection and try again.',
      errorType: 'NETWORK_ERROR',
      retryable: true,
    };
  }

  // Generic error
  return {
    success: false,
    message: error.message || 'An error occurred while scanning. Please try again.',
    errorType: 'UNKNOWN_ERROR',
    retryable: true,
  };
};

/**
 * Clean up rate limit map periodically (every 5 minutes)
 * Removes expired entries to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of scanRateLimitMap.entries()) {
    if (now > data.resetTime) {
      scanRateLimitMap.delete(userId);
    }
  }
}, 5 * 60 * 1000);

// 