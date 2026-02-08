import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 rounded-full mb-6 shadow-lg">
            <svg
              className="w-14 h-14 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Campus Pass</h1>
          <p className="text-gray-600 text-xl">Digital Outpass Management System</p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-12">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-base text-gray-600">
          <p>&copy; Campus Pass. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

// 
