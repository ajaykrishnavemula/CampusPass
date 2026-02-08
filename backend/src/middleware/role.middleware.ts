import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types';

export const adminOnly = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;

  if (!user || user.role !== UserRole.ADMIN) {
    return reply.status(403).send({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};

export const wardenOnly = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;

  if (!user || user.role !== UserRole.WARDEN) {
    return reply.status(403).send({
      success: false,
      message: 'Access denied. Warden privileges required.',
    });
  }
};

export const securityOnly = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;

  if (!user || user.role !== UserRole.SECURITY) {
    return reply.status(403).send({
      success: false,
      message: 'Access denied. Security privileges required.',
    });
  }
};

export const studentOnly = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as any;

  if (!user || user.role !== UserRole.STUDENT) {
    return reply.status(403).send({
      success: false,
      message: 'Access denied. Student privileges required.',
    });
  }
};

// 