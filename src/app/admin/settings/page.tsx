"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export default function SiteSettings() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState({
    siteName: 'Neurativo',
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    maxUsers: 1000,
    enableRegistration: true
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  const handleSave = () => {
    // In a real app, this would save to the database
    alert('Settings saved! (This is a demo)');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Site Settings
            </h1>
            <p className="text-gray-300 mt-1">Configure site settings and maintenance</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin/dashboard"
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:border-purple-400/50"
            >
              ← Back to Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:border-red-400/50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 shadow-2xl">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-200"
              />
            </div>

            {/* Maintenance Mode */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="w-5 h-5 text-purple-600 bg-black/20 border-purple-500/30 rounded focus:ring-purple-500/50"
                />
                <span className="text-sm font-medium text-purple-300">Enable Maintenance Mode</span>
              </label>
            </div>

            {/* Maintenance Message */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-200"
              />
            </div>

            {/* Max Users */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Maximum Users
              </label>
              <input
                type="number"
                value={settings.maxUsers}
                onChange={(e) => setSettings({...settings, maxUsers: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-200"
              />
            </div>

            {/* Enable Registration */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.enableRegistration}
                  onChange={(e) => setSettings({...settings, enableRegistration: e.target.checked})}
                  className="w-5 h-5 text-purple-600 bg-black/20 border-purple-500/30 rounded focus:ring-purple-500/50"
                />
                <span className="text-sm font-medium text-purple-300">Enable User Registration</span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
