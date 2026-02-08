import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.message,
    });
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    return reply.status(409).send({
      success: false,
      message: 'Duplicate entry found',
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return reply.status(statusCode).send({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const notFoundHandler = (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(404).send({
    success: false,
    message: `Route ${request.method}:${request.url} not found`,
  });
};

// 