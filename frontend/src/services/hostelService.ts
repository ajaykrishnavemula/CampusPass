import { api } from './api';

export interface HostelStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

export interface Hostel {
  _id: string;
  name: string;
  code: string;
  type: 'boys' | 'girls' | 'mixed';
  stats?: HostelStats;
}

export interface CreateHostelData {
  name: string;
  code?: string;
  type?: 'boys' | 'girls' | 'mixed';
}

export interface UpdateHostelData {
  name?: string;
  code?: string;
  type?: 'boys' | 'girls' | 'mixed';
}

class HostelService {
  // Get all hostels with statistics
  async getAllHostels(): Promise<Hostel[]> {
    const response = await api.get('/api/hostels');
    return response.data.data;
  }

  // Create new hostel (admin only)
  async createHostel(data: CreateHostelData): Promise<Hostel> {
    const response = await api.post('/api/hostels', data);
    return response.data.data;
  }

  // Update hostel (admin only)
  async updateHostel(id: string, data: UpdateHostelData): Promise<Hostel> {
    const response = await api.put(`/api/hostels/${id}`, data);
    return response.data.data;
  }

  // Delete hostel (admin only)
  async deleteHostel(id: string): Promise<void> {
    await api.delete(`/api/hostels/${id}`);
  }
}

export const hostelService = new HostelService();

// 
