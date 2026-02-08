import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isScanning,
}) => {
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lowLight, setLowLight] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<string>('');
  const scanTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    checkCameraPermission();
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (isScanning && cameraPermission === 'granted' && !manualEntry) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [isScanning, cameraPermission, manualEntry]);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state);
      
      result.addEventListener('change', () => {
        setCameraPermission(result.state);
      });

      if (result.state === 'granted') {
        await getCameras();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      // Try to get cameras anyway (some browsers don't support permissions API)
      await getCameras();
    }
  };

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      
      // Prefer back camera for mobile devices
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      setSelectedCamera(backCamera?.id || devices[0]?.id || '');
    } catch (error) {
      console.error('Failed to get cameras:', error);
      setScannerError('Unable to access camera devices');
      onScanError?.('Unable to access camera devices');
    }
  };

  const startScanner = async () => {
    if (!selectedCamera || scannerRef.current) return;

    try {
      setScannerError(null);
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore common scanning errors (no QR code in frame)
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('Scan error:', errorMessage);
          }
        }
      );

      // Monitor video brightness for low-light warning
      monitorBrightness();
    } catch (error: any) {
      console.error('Failed to start scanner:', error);
      setScannerError(error.message || 'Failed to start camera');
      onScanError?.(error.message || 'Failed to start camera');
      
      if (error.message?.includes('NotAllowedError')) {
        setCameraPermission('denied');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Failed to stop scanner:', error);
      }
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Prevent duplicate scans within 2 seconds
    if (lastScanRef.current === decodedText) {
      return;
    }

    lastScanRef.current = decodedText;
    onScanSuccess(decodedText);

    // Reset duplicate prevention after 2 seconds
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      lastScanRef.current = '';
    }, 2000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  const toggleFlash = async () => {
    // Note: Flash control is limited in web browsers
    // This is a placeholder for future implementation
    setFlashEnabled(!flashEnabled);
  };

  const monitorBrightness = () => {
    // Simplified brightness detection
    // In production, you'd analyze video frames
    const checkBrightness = () => {
      const hour = new Date().getHours();
      setLowLight(hour < 6 || hour > 20);
    };
    
    checkBrightness();
    const interval = setInterval(checkBrightness, 60000);
    
    return () => clearInterval(interval);
  };

  if (cameraPermission === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
        <svg
          className="h-16 w-16 text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
        <p className="text-gray-400 text-center mb-6">
          Please enable camera access in your browser settings to scan QR codes.
        </p>
        <button
          onClick={() => setManualEntry(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
        >
          Enter Code Manually
        </button>
      </div>
    );
  }

  if (manualEntry) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => setManualEntry(false)}
            className="mb-6 text-gray-400 hover:text-white flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scanner
          </button>

          <h3 className="text-2xl font-bold mb-6">Manual Entry</h3>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="manual-code" className="block text-sm font-medium mb-2">
                QR Code or Outpass ID
              </label>
              <input
                id="manual-code"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code or Outpass ID"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-400">
                You can enter either the QR code from the student's pass or the Outpass ID
              </p>
            </div>
            
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-900">
      {/* Scanner Container */}
      <div id="qr-reader" ref={videoRef} className="w-full h-full"></div>

      {/* Scan Frame Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-64 h-64 border-4 border-white rounded-lg">
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
            
            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-1 bg-indigo-500 animate-scan"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-auto">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Flash Toggle */}
          <button
            onClick={toggleFlash}
            className={`p-3 rounded-full ${
              flashEnabled ? 'bg-yellow-500' : 'bg-gray-800'
            } hover:bg-opacity-80 transition-colors`}
            aria-label="Toggle flash"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => setManualEntry(true)}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium text-white transition-colors"
          >
            Enter Manually
          </button>

          {/* Camera Switch */}
          {cameras.length > 1 && (
            <button
              onClick={() => {
                const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
                const nextIndex = (currentIndex + 1) % cameras.length;
                setSelectedCamera(cameras[nextIndex].id);
                stopScanner();
              }}
              className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              aria-label="Switch camera"
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Low Light Warning */}
        {lowLight && (
          <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 rounded-lg text-center">
            <p className="text-yellow-200 text-sm">
              ⚠️ Low light detected. Enable flash for better scanning.
            </p>
          </div>
        )}

        {/* Scanner Error */}
        {scannerError && (
          <div className="mt-4 p-3 bg-red-900 bg-opacity-50 rounded-lg text-center">
            <p className="text-red-200 text-sm">{scannerError}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-white text-sm">
            Position QR code within the frame
          </p>
        </div>
      </div>

      {/* Network Offline Warning */}
      {!navigator.onLine && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-red-600 text-white text-center">
          <p className="font-medium">⚠️ No internet connection. Scans will be queued.</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;

// 