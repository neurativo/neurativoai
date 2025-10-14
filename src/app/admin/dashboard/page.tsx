"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';
import { AdminUser, AdminRole, verifyAdminAccess, hasPermission, hasPermissionSync } from '@/lib/admin-auth';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalQuizzes: number;
  totalRevenue: number;
  todayViews: number;
  maintenanceMode: boolean;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    loadDashboardStats();
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
      if (!adminAccess.isAdmin || !adminAccess.user) {
        router.push('/admin/login');
        return;
      }

      setAdmin(adminAccess.user);
      setAdminRole(adminAccess.role || null);
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${admin?.id}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError('Failed to load dashboard statistics');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
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
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Welcome back, {admin.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-purple-600 rounded-full text-sm">
              {admin.role.replace('_', ' ').toUpperCase()}
            </span>
            <button
              onClick={() => {
                getSupabaseBrowser().auth.signOut();
                router.push('/');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-green-400">{stats.activeUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-check text-white text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Quizzes</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.totalQuizzes.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-question-circle text-white text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Revenue</p>
                  <p className="text-3xl font-bold text-yellow-400">${(stats.totalRevenue / 100).toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-white text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {hasPermissionSync(admin, adminRole, 'user_management') && (
                <button
                  onClick={() => router.push('/admin/users')}
                  className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-left"
                >
                  <i className="fas fa-users text-2xl mb-2"></i>
                  <div className="font-semibold">Manage Users</div>
                  <div className="text-sm text-gray-300">View and manage user accounts</div>
                </button>
              )}

              {hasPermissionSync(admin, adminRole, 'payment_management') && (
                <button
                  onClick={() => router.push('/admin/payments')}
                  className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-left"
                >
                  <i className="fas fa-credit-card text-2xl mb-2"></i>
                  <div className="font-semibold">Payment Management</div>
                  <div className="text-sm text-gray-300">Review and approve payments</div>
                </button>
              )}

              {hasPermissionSync(admin, adminRole, 'site_customization') && (
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-left"
                >
                  <i className="fas fa-cog text-2xl mb-2"></i>
                  <div className="font-semibold">Site Settings</div>
                  <div className="text-sm text-gray-300">Configure site options</div>
                </button>
              )}

              {hasPermissionSync(admin, adminRole, 'analytics_access') && (
                <button
                  onClick={() => router.push('/admin/analytics')}
                  className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-left"
                >
                  <i className="fas fa-chart-line text-2xl mb-2"></i>
                  <div className="font-semibold">Analytics</div>
                  <div className="text-sm text-gray-300">View detailed analytics</div>
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Maintenance Mode</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  stats?.maintenanceMode 
                    ? 'bg-red-600 text-white' 
                    : 'bg-green-600 text-white'
                }`}>
                  {stats?.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Today's Page Views</span>
                <span className="text-white font-semibold">{stats?.todayViews.toLocaleString() || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Server Status</span>
                <span className="px-3 py-1 bg-green-600 rounded-full text-sm text-white">
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="text-gray-400">
            Activity logs will be displayed here...
          </div>
        </div>
      </div>
    </div>
  );
}
