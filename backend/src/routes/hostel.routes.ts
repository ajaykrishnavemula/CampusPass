import { FastifyInstance } from 'fastify';
import { HostelController } from '../controllers/hostel.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

export async function hostelRoutes(fastify: FastifyInstance) {
  // Public route - get all hostels for dropdowns
  fastify.get('/hostels', { preHandler: [authenticate] }, HostelController.getAllHostels);
  
  // Admin only routes
  const adminPreHandler = [authenticate, adminOnly];
  fastify.post('/hostels', { preHandler: adminPreHandler }, HostelController.createHostel);
  fastify.put('/hostels/:id', { preHandler: adminPreHandler }, HostelController.updateHostel);
  fastify.delete('/hostels/:id', { preHandler: adminPreHandler }, HostelController.deleteHostel);
}

// 