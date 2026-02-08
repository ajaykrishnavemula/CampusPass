import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types';

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.status(401).send({
      success: false,
      message: 'Unauthorized - Invalid or expired token',
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - No user found',
      });
    }

    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
    }
  };
};

// 
