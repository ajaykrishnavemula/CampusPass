import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services';
import { LoginBody, RegisterBody, IUser } from '../types';
import { logger } from '../utils/logger';

export class AuthController {
  static async register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ) {
    try {
      const user = await AuthService.register(request.body);
      const token = request.server.jwt.sign(AuthService.generateJWTPayload(user));

      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: { user, token },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  static async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) {
    try {
      const { email, password } = request.body;
      const user = await AuthService.login(email, password);
      const token = request.server.jwt.sign(AuthService.generateJWTPayload(user));

      return reply.send({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  static async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).id;
      const user = await AuthService.getUserById(userId);

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'User not found',
        });
      }

      return reply.send({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch profile',
      });
    }
  }

  static async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).id;
      const user = await AuthService.updateProfile(userId, request.body as Partial<IUser>);

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).id;
      logger.info(`User logged out: ${userId}`);

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Logout failed',
      });
    }
  }

  static async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).id;
      const { currentPassword, newPassword } = request.body as {
        currentPassword: string;
        newPassword: string;
      };

      await AuthService.changePassword(userId, currentPassword, newPassword);

      return reply.send({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  static async getSystemStatus(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const { SystemSettings } = await import('../models');
      const settings = await SystemSettings.findOne();
      
      return reply.send({
        success: true,
        data: {
          isSystemActive: settings?.systemStatus === 'active',
          maxOutpassDuration: settings?.maxOutpassDuration ?? 7,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch system status',
      });
    }
  }
}

// 
