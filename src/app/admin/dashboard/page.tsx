"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalQuizzes: number;
  totalRevenue: number;
  todayViews: number;
  maintenanceMode: boolean;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
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
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        console.error('Failed to load stats:', data.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent truncate">
                Admin Dashboard
              </h1>
              <p className="text-gray-300 mt-1 text-sm sm:text-base truncate">Welcome back, {admin.email}</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <span className="px-2 sm:px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs sm:text-sm text-purple-300 whitespace-nowrap">
                {admin.role}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-6 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:border-red-400/50 text-sm sm:text-base whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-300">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 hover:border-green-400/50 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-300">Active Users</p>
                  <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-300">Total Quizzes</p>
                  <p className="text-3xl font-bold text-white">{stats.totalQuizzes}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-400/50 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-300">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <a
            href="/admin/users"
            className="bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-xl p-6 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-blue-300 transition-colors truncate">Manage Users</h3>
                <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors truncate">View and manage user accounts</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/payments"
            className="bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-xl p-6 border border-green-500/20 hover:border-green-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-green-300 transition-colors truncate">Payment Verification</h3>
                <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors truncate">Review and approve payments</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/settings"
            className="bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-purple-300 transition-colors truncate">Site Settings</h3>
                <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors truncate">Configure site settings</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-400/50 transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-yellow-300 transition-colors truncate">Analytics</h3>
                <p className="text-gray-400 text-xs sm:text-sm group-hover:text-gray-300 transition-colors truncate">View site analytics</p>
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
