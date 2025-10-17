"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import UserDetailsModal from '@/app/components/admin/UserDetailsModal';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  plan: string;
  is_active: boolean;
  is_admin?: boolean;
  total_quizzes: number;
  total_payments: number;
}

export default function UserManagement() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      router.push('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      console.log('Users API response:', { status: response.status, data });
      
      if (response.ok) {
        setUsers(data.users || []);
        console.log('Users loaded successfully:', data.users?.length || 0);
      } else {
        console.error('Failed to load users:', data.error);
        alert(`Failed to load users: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUpgradePlan = async (userId: string, newPlan: string) => {
    try {
      const response = await fetch('/api/admin/users/upgrade-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newPlan }),
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade plan');
      }

      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, plan: newPlan } : user
      ));

      alert(`User plan upgraded to ${newPlan}!`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export');
      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading users...</div>
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
              User Management
            </h1>
            <p className="text-gray-300 mt-1">Manage user accounts and permissions</p>
          </div>
                  <div className="flex gap-3">
                    <button
                      onClick={loadUsers}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 hover:border-blue-400/50"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={handleExportUsers}
                      className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 hover:border-green-400/50"
                    >
                      📊 Export Users
                    </button>
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

      {/* Filters */}
      <div className="p-6 bg-black/10 backdrop-blur-sm border-b border-purple-500/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Filter by Plan
            </label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-200"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="professional">Professional</option>
              <option value="mastery">Mastery</option>
              <option value="innovation">Innovation</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadUsers}
              className="w-full px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:border-purple-400/50"
            >
              Refresh Users
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-500/20">
              <thead className="bg-gradient-to-r from-purple-900/50 to-blue-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Quizzes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Status
                  </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                            Last Sign In
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
              </thead>
              <tbody className="bg-black/10 divide-y divide-purple-500/10">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-purple-500/10 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          user.plan === 'innovation' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' :
                          user.plan === 'mastery' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' :
                          user.plan === 'professional' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' :
                          'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                        }`}>
                          {user.plan}
                        </span>
                        {user.is_admin && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {user.total_quizzes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {user.total_payments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                          : 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewUser(user)}
                          className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-purple-300 hover:text-purple-200 transition-all"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleViewUser(user)}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:text-blue-200 transition-all"
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <div className="text-xl text-gray-300 mb-2">No users found</div>
            <div className="text-gray-400">No users match your current search criteria.</div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onUpgradePlan={handleUpgradePlan}
      />
    </div>
  );
}
