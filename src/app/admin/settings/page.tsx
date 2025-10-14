"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import { AdminUser, verifyAdminAccess, hasPermission } from '@/lib/admin-auth';

interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedIPs: string[];
  featureFlags: Record<string, boolean>;
  siteTitle: string;
  siteDescription: string;
  maxFileSize: number;
  maxQuestionsPerQuiz: number;
}

export default function SiteSettings() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    allowedIPs: [],
    featureFlags: {},
    siteTitle: 'Neurativo',
    siteDescription: 'AI-Powered Learning Platform',
    maxFileSize: 10,
    maxQuestionsPerQuiz: 20,
  });
  const [newIP, setNewIP] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    loadSettings();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        router.push('/admin/login');
        return;
      }

      const adminAccess = await verifyAdminAccess(session.access_token);
      if (!adminAccess.isAdmin || !adminAccess.user || !hasPermission(adminAccess.user.id, 'site_customization')) {
        router.push('/admin/dashboard');
        return;
      }

      setAdmin(adminAccess.user);
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${admin?.id}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      setSettings(data.settings || settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin?.id}`
        },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addIP = () => {
    if (newIP.trim() && !settings.allowedIPs.includes(newIP.trim())) {
      setSettings({
        ...settings,
        allowedIPs: [...settings.allowedIPs, newIP.trim()]
      });
      setNewIP('');
    }
  };

  const removeIP = (ip: string) => {
    setSettings({
      ...settings,
      allowedIPs: settings.allowedIPs.filter(i => i !== ip)
    });
  };

  const toggleFeatureFlag = (flag: string) => {
    setSettings({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [flag]: !settings.featureFlags[flag]
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Access denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Site Settings</h1>
            <p className="text-gray-400">Configure site-wide settings and maintenance mode</p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Maintenance Mode */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Enable Maintenance Mode</label>
                <p className="text-xs text-gray-400">Show maintenance page to all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter maintenance message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Allowed IP Addresses
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="Enter IP address (e.g., 192.168.1.1)"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={addIP}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                >
                  Add IP
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.allowedIPs.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center px-3 py-1 bg-gray-600 rounded-full text-sm"
                  >
                    {ip}
                    <button
                      onClick={() => removeIP(ip)}
                      className="ml-2 text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
          
          <div className="space-y-4">
            {Object.entries(settings.featureFlags).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300 capitalize">
                    {flag.replace(/_/g, ' ')}
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleFeatureFlag(flag)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Site Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Site Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Title
              </label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max File Size (MB)
              </label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Questions Per Quiz
              </label>
              <input
                type="number"
                value={settings.maxQuestionsPerQuiz}
                onChange={(e) => setSettings({ ...settings, maxQuestionsPerQuiz: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}