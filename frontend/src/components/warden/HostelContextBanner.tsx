import React from 'react';
import { Building2, Shield, Info } from 'lucide-react';

interface HostelContextBannerProps {
  hostelName: string;
  studentCount: number;
}

const HostelContextBanner: React.FC<HostelContextBannerProps> = ({ hostelName, studentCount }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section: Hostel Info */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{hostelName}</h2>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Warden</span>
              </span>
            </div>
            <p className="text-indigo-100 text-sm">
              Managing <span className="font-semibold">{studentCount}</span> students
            </p>
          </div>
        </div>

        {/* Right Section: Context Reminder */}
        <div className="flex items-start space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 max-w-md">
          <Info className="w-5 h-5 text-indigo-200 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium mb-1">Hostel-Specific View</p>
            <p className="text-xs text-indigo-100 leading-relaxed">
              You are viewing data only for your assigned hostel. All outpass requests and statistics are filtered accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelContextBanner;

// 