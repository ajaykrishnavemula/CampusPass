import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { outpassService } from '../../services/outpassService';
import { Outpass } from '../../types';

const OutpassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchOutpassDetails();
    }
  }, [id]);

  const fetchOutpassDetails = async () => {
    try {
      const data = await outpassService.getOutpassById(id!);
      setOutpass(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load outpass details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    
    setDownloading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const blob = await outpassService.downloadOutpassPDF(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `outpass-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setSuccessMessage('PDF downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCancelOutpass = async () => {
    if (!id || !outpass) return;
    
    if (!window.confirm('Are you sure you want to cancel this outpass request?')) {
      return;
    }
    
    setCancelling(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const updatedOutpass = await outpassService.cancelOutpass(id);
      setOutpass(updatedOutpass);
      setSuccessMessage('Outpass cancelled successfully!');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel outpass. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !outpass) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error || 'Outpass not found'}</p>
          <Link
            to="/student/dashboard"
            className="mt-4 inline-block text-red-600 hover:text-red-500 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Outpass Details</h1>
              <p className="text-indigo-100 mt-1">ID: {outpass._id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(outpass.status)}`}>
              {outpass.status.charAt(0).toUpperCase() + outpass.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          
          {error && !loading && outpass && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Purpose and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Purpose</label>
              <p className="text-lg font-semibold text-gray-900">{outpass.purpose}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Destination</label>
              <p className="text-lg font-semibold text-gray-900">{outpass.destination}</p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">Departure</label>
                <div className="space-y-1">
                  <p className="text-gray-900 font-medium">
                    📅 {new Date(outpass.fromDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-gray-900 font-medium">
                    ⏰ {new Date(outpass.fromDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">Return</label>
                <div className="space-y-1">
                  <p className="text-gray-900 font-medium">
                    📅 {new Date(outpass.toDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-gray-900 font-medium">
                    ⏰ {new Date(outpass.toDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact</label>
                <p className="text-gray-900 font-medium">🚨 {outpass.emergencyContact}</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {outpass.remarks && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Remarks</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{outpass.remarks}</p>
            </div>
          )}

          {/* Approval/Rejection Details */}
          {outpass.status !== 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {outpass.status === 'approved' ? 'Approval' : 'Rejection'} Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {outpass.approvedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {outpass.status === 'approved' ? 'Approved By' : 'Rejected By'}
                    </label>
                    <p className="text-gray-900 font-medium">
                      {typeof outpass.approvedBy === 'object' ? outpass.approvedBy.name : 'N/A'}
                    </p>
                  </div>
                )}
                {outpass.approvedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {outpass.status === 'approved' ? 'Approved At' : 'Rejected At'}
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(outpass.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {outpass.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Reason</label>
                    <p className="text-gray-900">{outpass.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-in/Check-out Status */}
          {outpass.status === 'approved' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gate Pass Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 ${outpass.checkOutTime ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Check-Out</label>
                  {outpass.checkOutTime ? (
                    <p className="text-green-700 font-medium">
                      ✅ {new Date(outpass.checkOutTime).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-gray-500">⏳ Pending</p>
                  )}
                </div>
                <div className={`rounded-lg p-4 ${outpass.checkInTime ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Check-In</label>
                  {outpass.checkInTime ? (
                    <p className="text-green-700 font-medium">
                      ✅ {new Date(outpass.checkInTime).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-gray-500">⏳ Pending</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          {outpass.status === 'approved' && outpass.qrCode && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
              <div className="flex flex-col items-center bg-gray-50 rounded-lg p-6">
                <img
                  src={outpass.qrCode}
                  alt="Outpass QR Code"
                  className="w-64 h-64 border-4 border-white shadow-lg rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Show this QR code at the security gate for check-in/check-out
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-4">
            {(outpass.status === 'approved' || outpass.status === 'checked_out' || outpass.status === 'checked_in') && outpass.qrCode && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>📄 Download PDF</>
                )}
              </button>
            )}
            {outpass.status === 'pending' && (
              <button
                onClick={handleCancelOutpass}
                disabled={cancelling}
                className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  <>❌ Cancel Request</>
                )}
              </button>
            )}
            <Link
              to="/student/dashboard"
              className="flex-1 md:flex-none px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Request Created</p>
              <p className="text-sm text-gray-500">{new Date(outpass.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {outpass.approvedAt && (
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${outpass.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  {outpass.status === 'approved' ? 'Approved' : 'Rejected'}
                </p>
                <p className="text-sm text-gray-500">{new Date(outpass.approvedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          {outpass.checkOutTime && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Checked Out</p>
                <p className="text-sm text-gray-500">{new Date(outpass.checkOutTime).toLocaleString()}</p>
              </div>
            </div>
          )}
          {outpass.checkInTime && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Checked In</p>
                <p className="text-sm text-gray-500">{new Date(outpass.checkInTime).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutpassDetails;

// 
