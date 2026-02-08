import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Simple in-memory rate limiter for admin endpoints
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export const createRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
      });
    }

    const key = `${user.id}:${request.routerPath}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      // Initialize or reset
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return;
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      return reply.status(429).send({
        success: false,
        message,
        retryAfter,
      });
    }
  };
};

// Predefined rate limiters for different sensitivity levels
export const strictRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many sensitive operations. Please try again in 15 minutes.',
});

export const moderateRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  message: 'Too many requests. Please try again in 15 minutes.',
});

export const standardRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests. Please try again later.',
});

// 