import React from 'react';
import { AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PriorityAlertsProps {
  pendingCount: number;
  overdueCount: number;
}

const PriorityAlerts: React.FC<PriorityAlertsProps> = ({ pendingCount, overdueCount }) => {
  // Don't show if no alerts
  if (pendingCount === 0 && overdueCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Overdue Alert - Highest Priority */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    Overdue Outpasses Require Immediate Attention
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    <span className="font-bold">{overdueCount}</span> student{overdueCount > 1 ? 's have' : ' has'} not returned on time. 
                    Please review and take appropriate action.
                  </p>
                </div>
                <Link
                  to="/warden/dashboard?filter=overdue"
                  className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  View Overdue
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-amber-800">
                Pending Approval Requests
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                <span className="font-bold">{pendingCount}</span> outpass request{pendingCount > 1 ? 's are' : ' is'} waiting for your review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Alert - All Clear */}
      {pendingCount === 0 && overdueCount === 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-green-800">All Clear</h3>
              <p className="text-sm text-green-700 mt-1">
                No pending approvals or overdue outpasses at this time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriorityAlerts;

// 