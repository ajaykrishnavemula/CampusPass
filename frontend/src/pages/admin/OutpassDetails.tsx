import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { Outpass } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Phone, User as UserIcon, AlertCircle, Clock, FileText } from 'lucide-react';

const AdminOutpassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOutpassDetails();
    }
  }, [id]);

  const fetchOutpassDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getOutpassById(id!);
      
      if (response.success && response.data) {
        setOutpass(response.data);
      } else {
        setError('Failed to load outpass details');
      }
    } catch (err: any) {
      console.error('Failed to fetch outpass details:', err);
      setError(err.response?.data?.message || 'Failed to load outpass details');
      toast.error('Failed to load outpass details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      checked_out: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked Out' },
      checked_in: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Checked In' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
    };

    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !outpass) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Outpass</h2>
          <p className="text-red-600 mb-4">{error || 'Outpass not found'}</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Outpass Details</h1>
          {getStatusBadge(outpass.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{(outpass.student as any)?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Roll Number</p>
                <p className="font-medium text-gray-900">{(outpass.student as any)?.rollNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{(outpass.student as any)?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{(outpass.student as any)?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hostel</p>
                <p className="font-medium text-gray-900">{(outpass.student as any)?.hostel?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Outpass Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Outpass Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Purpose</p>
                <p className="font-medium text-gray-900">{outpass.purpose || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Destination</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  {outpass.destination || 'N/A'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">From Date & Time</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {outpass.fromDate ? format(new Date(outpass.fromDate), 'PPp') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Date & Time</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {outpass.toDate ? format(new Date(outpass.toDate), 'PPp') : 'N/A'}
                  </p>
                </div>
              </div>
              {outpass.reason && (
                <div>
                  <p className="text-sm text-gray-500">Additional Reason</p>
                  <p className="font-medium text-gray-900">{outpass.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {(outpass.parentContact || outpass.emergencyContact) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outpass.parentContact && (
                  <div>
                    <p className="text-sm text-gray-500">Parent Contact</p>
                    <p className="font-medium text-gray-900">{outpass.parentContact}</p>
                  </div>
                )}
                {outpass.emergencyContact && (
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium text-gray-900">{outpass.emergencyContact}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval/Rejection Details */}
          {(outpass.status === 'approved' || outpass.status === 'rejected' || outpass.status === 'checked_out' || outpass.status === 'checked_in') && (outpass.warden || outpass.approvedAt) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {outpass.status === 'rejected' ? 'Rejection Details' : 'Approval Details'}
              </h2>
              <div className="space-y-3">
                {(outpass.warden as any)?.name && (
                  <div>
                    <p className="text-sm text-gray-500">Approved By (Warden)</p>
                    <p className="font-medium text-gray-900">{(outpass.warden as any).name}</p>
                  </div>
                )}
                {(outpass.warden as any)?.email && (
                  <div>
                    <p className="text-sm text-gray-500">Warden Email</p>
                    <p className="font-medium text-gray-900">{(outpass.warden as any).email}</p>
                  </div>
                )}
                {outpass.approvedAt && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {outpass.status === 'rejected' ? 'Rejected At' : 'Approved At'}
                    </p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(outpass.approvedAt), 'PPp')}
                    </p>
                  </div>
                )}
                {(outpass as any).wardenNote && (
                  <div>
                    <p className="text-sm text-gray-500">Warden Note</p>
                    <p className="font-medium text-gray-900">{(outpass as any).wardenNote}</p>
                  </div>
                )}
                {outpass.rejectionReason && (
                  <div>
                    <p className="text-sm text-gray-500">Rejection Reason</p>
                    <p className="font-medium text-red-600">{outpass.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-in/Check-out Details */}
          {(outpass.checkOutTime || outpass.checkInTime) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Check-in/Check-out Details
              </h2>
              <div className="space-y-3">
                {outpass.checkOutTime && (
                  <div>
                    <p className="text-sm text-gray-500">Checked Out At</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(outpass.checkOutTime), 'PPp')}
                    </p>
                  </div>
                )}
                {outpass.checkInTime && (
                  <div>
                    <p className="text-sm text-gray-500">Checked In At</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(outpass.checkInTime), 'PPp')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-500">
                    {outpass.createdAt ? format(new Date(outpass.createdAt), 'PPp') : 'N/A'}
                  </p>
                </div>
              </div>
              
              {outpass.approvedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {outpass.status === 'approved' ? 'Approved' : 'Rejected'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(outpass.approvedAt), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
              
              {outpass.checkOutTime && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Checked Out</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(outpass.checkOutTime), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
              
              {outpass.checkInTime && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gray-600 rounded-full"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Checked In</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(outpass.checkInTime), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Outpass ID:</span>
                <span className="font-medium text-blue-900">{outpass._id?.slice(-8) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Status:</span>
                <span className="font-medium text-blue-900 capitalize">{outpass.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Duration:</span>
                <span className="font-medium text-blue-900">
                  {outpass.fromDate && outpass.toDate
                    ? `${Math.ceil((new Date(outpass.toDate).getTime() - new Date(outpass.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOutpassDetails;

// 
