import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import adminService, { SystemSettings as APISystemSettings } from '../../services/adminService';

interface LocalSettings {
  systemStatus: 'ACTIVE' | 'INACTIVE';
  siteName: string;
  maxOutpassDuration: number;
  qrCodeExpiry: number;
  overdueCheckInterval: number;
  overdueThreshold: number;
  autoRejectionDays: number | null;
  autoApprovalEnabled: boolean;
  qrEnforcementEnabled: boolean;
  notificationsEnabled: boolean;
  lastUpdatedBy?: string;
  updatedAt?: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<LocalSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<LocalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings && originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemSettings();
      
      // Transform API response to local format
      const localSettings: LocalSettings = {
        systemStatus: response.systemStatus as 'ACTIVE' | 'INACTIVE',
        siteName: response.generalSettings.siteName || 'Campus Pass Management System',
        maxOutpassDuration: response.generalSettings.maxOutpassDuration,
        qrCodeExpiry: response.generalSettings.qrCodeExpiry || 24,
        overdueCheckInterval: response.generalSettings.overdueCheckInterval || 15,
        overdueThreshold: response.policySettings?.overdueThreshold || 3,
        autoRejectionDays: response.policySettings?.autoRejectionDays || null,
        autoApprovalEnabled: response.policySettings?.autoRestrictionEnabled || false,
        qrEnforcementEnabled: response.featureToggles.qrCodeEnabled,
        notificationsEnabled: response.featureToggles.notificationsEnabled,
      };
      
      setSettings(localSettings);
      setOriginalSettings(localSettings);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Validation
    if (!settings.siteName || settings.siteName.trim().length < 3) {
      toast.error('Site name must be at least 3 characters');
      return;
    }
    
    if (settings.maxOutpassDuration < 1 || settings.maxOutpassDuration > 168) {
      toast.error('Max outpass duration must be between 1 and 168 hours (7 days)');
      return;
    }
    
    if (settings.qrCodeExpiry < 1 || settings.qrCodeExpiry > 168) {
      toast.error('QR code expiry must be between 1 and 168 hours');
      return;
    }
    
    if (settings.overdueCheckInterval < 5 || settings.overdueCheckInterval > 60) {
      toast.error('Overdue check interval must be between 5 and 60 minutes');
      return;
    }
    
    if (settings.overdueThreshold < 1 || settings.overdueThreshold > 10) {
      toast.error('Overdue threshold must be between 1 and 10');
      return;
    }
    
    if (settings.autoRejectionDays !== null && (settings.autoRejectionDays < 1 || settings.autoRejectionDays > 30)) {
      toast.error('Auto-rejection days must be between 1 and 30, or leave empty to disable');
      return;
    }

    // Confirm critical changes
    if (settings.systemStatus !== originalSettings?.systemStatus) {
      const action = settings.systemStatus === 'INACTIVE' ? 'deactivate' : 'activate';
      if (!window.confirm(`Are you sure you want to ${action} the system? This will affect all users.`)) {
        return;
      }
    }

    try {
      setSaving(true);
      
      // Transform local settings to API format (partial update)
      const apiSettings: any = {
        systemStatus: settings.systemStatus,
        generalSettings: {
          siteName: settings.siteName,
          maxOutpassDuration: settings.maxOutpassDuration,
          qrCodeExpiry: settings.qrCodeExpiry,
          overdueCheckInterval: settings.overdueCheckInterval,
        },
        policySettings: {
          overdueThreshold: settings.overdueThreshold,
          autoRejectionDays: settings.autoRejectionDays,
          autoRestrictionEnabled: settings.autoApprovalEnabled,
        },
        featureToggles: {
          qrCodeEnabled: settings.qrEnforcementEnabled,
          notificationsEnabled: settings.notificationsEnabled,
        },
      };
      
      await adminService.updateSystemSettings(apiSettings);
      toast.success('Settings updated successfully');
      setOriginalSettings(settings);
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to discard all changes?')) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        {hasChanges && (
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>

      {/* System Status Banner */}
      {settings.systemStatus === 'INACTIVE' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-red-800 font-semibold">System is Currently INACTIVE</p>
              <p className="text-red-700 text-sm">Users cannot create or manage outpasses</p>
            </div>
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({
                ...settings,
                siteName: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Campus Pass Management System"
            />
            <p className="text-xs text-gray-500 mt-1">
              The name displayed across the system
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="text-base font-semibold text-gray-900">System Status</p>
              <p className="text-sm text-gray-600 mt-1">
                {settings.systemStatus === 'ACTIVE'
                  ? 'System is operational and users can create outpasses'
                  : 'System is disabled and users cannot create outpasses'}
              </p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                systemStatus: settings.systemStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
              })}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                settings.systemStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.systemStatus === 'ACTIVE' ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Outpass Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outpass Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Maximum Outpass Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.maxOutpassDuration}
                onChange={(e) => setSettings({
                  ...settings,
                  maxOutpassDuration: parseInt(e.target.value) || 1
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: 168 hours (7 days). Current: {(settings.maxOutpassDuration / 24).toFixed(1)} days
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                QR Code Expiry (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.qrCodeExpiry}
                onChange={(e) => setSettings({
                  ...settings,
                  qrCodeExpiry: parseInt(e.target.value) || 1
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long QR codes remain valid (1-168 hours)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Auto-Rejection Days (optional)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={settings.autoRejectionDays || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  autoRejectionDays: e.target.value ? parseInt(e.target.value) : null
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave empty to disable"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-reject pending outpasses after X days (1-30, or empty to disable)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="text-base font-semibold text-gray-900">Auto-Approval</p>
              <p className="text-sm text-gray-600 mt-1">
                Automatically approve outpasses without warden review
              </p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                autoApprovalEnabled: !settings.autoApprovalEnabled
              })}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                settings.autoApprovalEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.autoApprovalEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Policy Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Policy Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Overdue Check Interval (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.overdueCheckInterval}
                onChange={(e) => setSettings({
                  ...settings,
                  overdueCheckInterval: parseInt(e.target.value) || 5
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How often system checks for overdue outpasses (5-60 minutes)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Overdue Threshold
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.overdueThreshold}
                onChange={(e) => setSettings({
                  ...settings,
                  overdueThreshold: parseInt(e.target.value) || 1
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of overdues before student restriction (1-10)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Toggles</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-base font-semibold text-gray-900">QR Code Enforcement</p>
              <p className="text-sm text-gray-600 mt-1">
                Require QR code scanning for entry/exit
              </p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                qrEnforcementEnabled: !settings.qrEnforcementEnabled
              })}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                settings.qrEnforcementEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.qrEnforcementEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="text-base font-semibold text-gray-900">Real-time Notifications</p>
              <p className="text-sm text-gray-600 mt-1">
                Enable push notifications for all users
              </p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                notificationsEnabled: !settings.notificationsEnabled
              })}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {originalSettings?.updatedAt && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Last updated: {new Date(originalSettings.updatedAt).toLocaleString()}
            {originalSettings.lastUpdatedBy && ` by ${originalSettings.lastUpdatedBy}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;

// 