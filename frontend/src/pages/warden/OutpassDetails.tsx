import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import wardenService from '../../services/wardenService';
import { Outpass, User } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Phone, User as UserIcon, AlertCircle } from 'lucide-react';

// Import components
import ApproveModal from '../../components/warden/ApproveModal';
import RejectModal from '../../components/warden/RejectModal';

const WardenOutpassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOutpassDetails();
    }
  }, [id]);

  const fetchOutpassDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await wardenService.getOutpassById(id!);
      
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

  const handleApproveConfirm = async (note?: string) => {
    if (!outpass) return;

    try {
      setActionLoading(true);
      const response = await wardenService.approveOutpass(outpass._id, note);

      if (response.success) {
        toast.success('Outpass approved successfully');
        setApproveModal(false);
        navigate('/warden/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to approve outpass:', error);
      toast.error(error.response?.data?.message || 'Failed to approve outpass');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!outpass) return;

    try {
      setActionLoading(true);
      const response = await wardenService.rejectOutpass(outpass._id, reason);

      if (response.success) {
        toast.success('Outpass rejected successfully');
        setRejectModal(false);
        navigate('/warden/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to reject outpass:', error);
      toast.error(error.response?.data?.message || 'Failed to reject outpass');
    } finally {
      setActionLoading(false);
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
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading outpass details...</p>
        </div>
      </div>
    );
  }

  if (error || !outpass) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-700">{error || 'Outpass not found'}</p>
              <Link
                to="/warden/dashboard"
                className="mt-4 inline-flex items-center text-red-600 hover:text-red-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const student = outpass.student as User;
  const isPending = outpass.status === 'pending';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/warden/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          {getStatusBadge(outpass.status)}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Outpass Details</h1>
            <p className="text-indigo-100 text-sm">ID: {outpass._id}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Information */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Roll Number</label>
                  <p className="text-sm font-medium text-gray-900">{student.rollNumber}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                  <p className="text-sm font-medium text-gray-900">{student.department}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <p className="text-sm font-medium text-gray-900">Year {student.year}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hostel</label>
                  <p className="text-sm font-medium text-gray-900">{student.hostel}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Room Number</label>
                  <p className="text-sm font-medium text-gray-900">{student.roomNumber}</p>
                </div>
              </div>

              {/* Student Badges */}
              {(student.overdueCount > 0 || !student.canCreateOutpass) && (
                <div className="flex items-center space-x-2 mt-4">
                  {student.overdueCount > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{student.overdueCount} Overdue</span>
                    </span>
                  )}
                  {!student.canCreateOutpass && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                      ⛔ Restricted
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Outpass Details */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Outpass Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
                  <p className="text-base font-semibold text-gray-900 capitalize">{outpass.purpose}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
                  <p className="text-base font-semibold text-gray-900">{outpass.destination}</p>
                </div>
              </div>
              {outpass.reason && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{outpass.reason}</p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="block text-xs font-medium text-green-700 mb-2">Departure</label>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      📅 {format(new Date(outpass.fromDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    {outpass.fromTime && (
                      <p className="text-sm font-medium text-gray-900">
                        ⏰ {outpass.fromTime}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="block text-xs font-medium text-red-700 mb-2">Return</label>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      📅 {format(new Date(outpass.toDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    {outpass.toTime && (
                      <p className="text-sm font-medium text-gray-900">
                        ⏰ {outpass.toTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Phone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student Contact</label>
                  <p className="text-sm font-medium text-gray-900">📞 {outpass.contactNumber || student.phone}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Emergency Contact</label>
                  <p className="text-sm font-medium text-gray-900">🚨 {outpass.emergencyContact}</p>
                </div>
              </div>
            </div>

            {/* Approval/Rejection Details */}
            {!isPending && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {outpass.status === 'approved' ? 'Approval' : 'Rejection'} Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {outpass.approvedBy && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {outpass.status === 'approved' ? 'Approved By' : 'Rejected By'}
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {typeof outpass.approvedBy === 'object' ? outpass.approvedBy.name : 'N/A'}
                      </p>
                    </div>
                  )}
                  {outpass.approvedAt && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date & Time</label>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(outpass.approvedAt), 'PPpp')}
                      </p>
                    </div>
                  )}
                  {outpass.wardenRemarks && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
                      <p className="text-sm text-gray-900">{outpass.wardenRemarks}</p>
                    </div>
                  )}
                  {outpass.rejectionReason && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                      <p className="text-sm text-gray-900">{outpass.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isPending && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setApproveModal(true)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>✅</span>
                  <span>Approve Outpass</span>
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>❌</span>
                  <span>Reject Outpass</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Approve Modal */}
        <ApproveModal
          outpass={outpass}
          isOpen={approveModal}
          onClose={() => setApproveModal(false)}
          onConfirm={handleApproveConfirm}
          loading={actionLoading}
        />

        {/* Reject Modal */}
        <RejectModal
          outpass={outpass}
          isOpen={rejectModal}
          onClose={() => setRejectModal(false)}
          onConfirm={handleRejectConfirm}
          loading={actionLoading}
        />
      </div>
  );
};

export default WardenOutpassDetails;

// 
