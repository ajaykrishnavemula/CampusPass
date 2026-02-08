import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorBoundary from '../../components/ErrorBoundary';
import QRScanner from '../../components/security/QRScanner';
import ScanResultCard from '../../components/security/ScanResultCard';
import { securityService, QRValidationResult } from '../../services/securityService';

type ScanState = 'scanning' | 'result' | 'processing' | 'success';

const ScanQRContent: React.FC = () => {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [validationResult, setValidationResult] = useState<QRValidationResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoResetTimer, setAutoResetTimer] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (autoResetTimer) {
        clearTimeout(autoResetTimer);
      }
    };
  }, [autoResetTimer]);

  const handleScanSuccess = async (qrCode: string) => {
    try {
      setScanState('processing');
      setProcessing(true);

      // Validate QR code
      const result = await securityService.validateQR(qrCode);
      
      setValidationResult(result);
      setScanState('result');
      setProcessing(false);

      // Show toast notification
      if (result.valid) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('QR validation failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to validate QR code';
      toast.error(errorMessage);
      
      // Show error result
      setValidationResult({
        valid: false,
        state: 'INVALID',
        message: errorMessage,
        reason: error.response?.data?.error || error.message || 'Validation failed',
      });
      setScanState('result');
      setProcessing(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
    toast.error(error);
  };

  const handleCheckOut = async () => {
    if (!validationResult?.outpass?._id) return;

    try {
      setProcessing(true);
      
      const response = await securityService.checkOut(validationResult.outpass._id);
      
      toast.success(response.message);
      setScanState('success');
      
      // Auto-reset after 3 seconds
      const timer = window.setTimeout(() => {
        resetScanner();
      }, 3000);
      setAutoResetTimer(timer);
    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast.error(error.message || 'Failed to check out student');
      setProcessing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!validationResult?.outpass?._id) return;

    try {
      setProcessing(true);
      
      const response = await securityService.checkIn(validationResult.outpass._id);
      
      if (response.outpass.isOverdue) {
        toast.success(`${response.message} (Overdue by ${Math.floor(response.outpass.minutesOverdue! / 60)}h ${response.outpass.minutesOverdue! % 60}m)`, {
          duration: 5000,
        });
      } else {
        toast.success(response.message);
      }
      
      setScanState('success');
      
      // Auto-reset after 3 seconds
      const timer = window.setTimeout(() => {
        resetScanner();
      }, 3000);
      setAutoResetTimer(timer);
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast.error(error.message || 'Failed to check in student');
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
      setAutoResetTimer(null);
    }
    
    setValidationResult(null);
    setScanState('scanning');
    setProcessing(false);
  };

  const handleClose = () => {
    navigate('/security/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 flex items-center"
          >
            <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-white text-xl font-bold">Scan QR Code</h1>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Scanner or Result */}
      {scanState === 'scanning' || scanState === 'processing' ? (
        <div className="h-full">
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            isScanning={scanState === 'scanning'}
          />
          
          {scanState === 'processing' && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
                <p className="text-white text-lg">Validating QR Code...</p>
              </div>
            </div>
          )}
        </div>
      ) : scanState === 'result' ? (
        <div className="h-full flex items-center justify-center p-6 overflow-y-auto">
          <div className="relative">
            <ScanResultCard
              result={validationResult}
              onCheckOut={handleCheckOut}
              onCheckIn={handleCheckIn}
              onClose={resetScanner}
              loading={processing}
            />
          </div>
        </div>
      ) : (
        // Success State
        <div className="h-full flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 text-green-600 rounded-full p-4">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Operation completed successfully. Returning to scanner...
            </p>
            
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      )}

      {/* Network Status Indicator */}
      {!navigator.onLine && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-30">
          <p className="font-medium">⚠️ No internet connection</p>
        </div>
      )}
    </div>
  );
};

const ScanQR: React.FC = () => {
  const cameraFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Camera Error</h2>
        <p className="text-gray-600 mb-4">
          Unable to access camera. Please check permissions or try manual entry.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={cameraFallback}>
      <ScanQRContent />
    </ErrorBoundary>
  );
};

export default ScanQR;

// 
