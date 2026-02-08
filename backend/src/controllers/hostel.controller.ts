import { FastifyRequest, FastifyReply } from 'fastify';
import { Hostel } from '../models/Hostel';
import { Outpass } from '../models/Outpass';
import { logger } from '../utils/logger';

export class HostelController {
  // Get all hostels (for dropdowns and listing)
  static async getAllHostels(request: FastifyRequest, reply: FastifyReply) {
    try {
      const hostels = await Hostel.find({ isActive: true })
        .select('name code type')
        .sort({ name: 1 });

      // Get outpass statistics for each hostel
      const hostelsWithStats = await Promise.all(
        hostels.map(async (hostel) => {
          const outpasses = await Outpass.find({
            'student.hostel': hostel.name,
          });

          const stats = {
            total: outpasses.length,
            approved: outpasses.filter((op) => op.status === 'approved').length,
            rejected: outpasses.filter((op) => op.status === 'rejected').length,
            pending: outpasses.filter((op) => op.status === 'pending').length,
          };

          return {
            _id: hostel._id,
            name: hostel.name,
            code: hostel.code,
            type: hostel.type,
            stats,
          };
        })
      );

      reply.send({
        success: true,
        data: hostelsWithStats,
      });
    } catch (error) {
      logger.error('Error fetching hostels:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to fetch hostels',
      });
    }
  }

  // Create new hostel
  static async createHostel(
    request: FastifyRequest<{
      Body: {
        name: string;
        code?: string;
        type?: 'boys' | 'girls' | 'mixed';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { name, code, type } = request.body;

      if (!name || !name.trim()) {
        return reply.status(400).send({
          success: false,
          message: 'Hostel name is required',
        });
      }

      // Check if hostel with same name exists
      const existingHostel = await Hostel.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });

      if (existingHostel) {
        return reply.status(400).send({
          success: false,
          message: 'Hostel with this name already exists',
        });
      }

      // Generate code from name if not provided
      const hostelCode =
        code ||
        name
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_')
          .substring(0, 10);

      // Create hostel with minimal required fields
      const hostel = new Hostel({
        name: name.trim(),
        code: hostelCode,
        type: type || 'mixed',
        capacity: 100, // Default capacity
        currentOccupancy: 0,
        address: 'To be updated',
        contactNumber: '0000000000',
        facilities: [],
        isActive: true,
      });

      await hostel.save();

      logger.info(`Hostel created: ${hostel.name} by admin ${(request.user as any)?.userId}`);

      reply.status(201).send({
        success: true,
        message: 'Hostel created successfully',
        data: {
          _id: hostel._id,
          name: hostel.name,
          code: hostel.code,
          type: hostel.type,
        },
      });
    } catch (error: any) {
      logger.error('Error creating hostel:', error);
      
      if (error.code === 11000) {
        return reply.status(400).send({
          success: false,
          message: 'Hostel code already exists',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to create hostel',
      });
    }
  }

  // Update hostel
  static async updateHostel(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        name?: string;
        code?: string;
        type?: 'boys' | 'girls' | 'mixed';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { name, code, type } = request.body;

      const hostel = await Hostel.findById(id);

      if (!hostel) {
        return reply.status(404).send({
          success: false,
          message: 'Hostel not found',
        });
      }

      // Update fields if provided
      if (name && name.trim()) {
        // Check if another hostel has this name
        const existingHostel = await Hostel.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        });

        if (existingHostel) {
          return reply.status(400).send({
            success: false,
            message: 'Another hostel with this name already exists',
          });
        }

        hostel.name = name.trim();
      }

      if (code && code.trim()) {
        hostel.code = code.trim().toUpperCase();
      }

      if (type) {
        hostel.type = type;
      }

      await hostel.save();

      logger.info(`Hostel updated: ${hostel.name} by admin ${(request.user as any)?.userId}`);

      reply.send({
        success: true,
        message: 'Hostel updated successfully',
        data: {
          _id: hostel._id,
          name: hostel.name,
          code: hostel.code,
          type: hostel.type,
        },
      });
    } catch (error: any) {
      logger.error('Error updating hostel:', error);

      if (error.code === 11000) {
        return reply.status(400).send({
          success: false,
          message: 'Hostel code already exists',
        });
      }

      reply.status(500).send({
        success: false,
        message: 'Failed to update hostel',
      });
    }
  }

  // Delete hostel (soft delete)
  static async deleteHostel(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      const hostel = await Hostel.findById(id);

      if (!hostel) {
        return reply.status(404).send({
          success: false,
          message: 'Hostel not found',
        });
      }

      // Soft delete by setting isActive to false
      hostel.isActive = false;
      await hostel.save();

      logger.info(`Hostel deleted: ${hostel.name} by admin ${(request.user as any)?.userId}`);

      reply.send({
        success: true,
        message: 'Hostel deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting hostel:', error);
      reply.status(500).send({
        success: false,
        message: 'Failed to delete hostel',
      });
    }
  }
}

// 