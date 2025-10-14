"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export default function Analytics() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [analytics, setAnalytics] = useState({
    pageViews: 1250,
    uniqueVisitors: 890,
    bounceRate: 35.2,
    avgSessionDuration: '2m 45s',
    topPages: [
      { page: '/', views: 450 },
      { page: '/quiz', views: 320 },
      { page: '/pricing', views: 280 },
      { page: '/about', views: 200 }
    ],
    userGrowth: [
      { month: 'Jan', users: 120 },
      { month: 'Feb', users: 180 },
      { month: 'Mar', users: 250 },
      { month: 'Apr', users: 320 },
      { month: 'May', users: 410 },
      { month: 'Jun', users: 520 }
    ]
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading analytics...</div>
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
              Analytics
            </h1>
            <p className="text-gray-300 mt-1">View site analytics and performance metrics</p>
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

      {/* Analytics Content */}
      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-300">Page Views</p>
                <p className="text-3xl font-bold text-white">{analytics.pageViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 hover:border-green-400/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-300">Unique Visitors</p>
                <p className="text-3xl font-bold text-white">{analytics.uniqueVisitors.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-400/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-300">Bounce Rate</p>
                <p className="text-3xl font-bold text-white">{analytics.bounceRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-300">Avg. Session</p>
                <p className="text-3xl font-bold text-white">{analytics.avgSessionDuration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Top Pages</h3>
            <div className="space-y-3">
              {analytics.topPages.map((page, index) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-300">{page.page}</span>
                  </div>
                  <span className="text-white font-semibold">{page.views} views</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">User Growth</h3>
            <div className="space-y-3">
              {analytics.userGrowth.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-gray-300">{month.month}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-700 rounded-full h-2 mr-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${(month.users / 600) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold">{month.users}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
