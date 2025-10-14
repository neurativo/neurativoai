// Simple admin system - no complex auth, just basic validation

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
}

// Hardcoded admin users for simplicity
const ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin-1',
    email: 'admin@neurativo.com',
    role: 'super_admin'
  }
];

export function validateAdmin(email: string, password: string): AdminUser | null {
  // Simple validation - in production, use proper auth
  if (email === 'admin@neurativo.com' && password === 'admin123') {
    return ADMIN_USERS[0];
  }
  return null;
}

export function getAdminById(id: string): AdminUser | null {
  return ADMIN_USERS.find(admin => admin.id === id) || null;
}

export function hasPermission(admin: AdminUser, permission: string): boolean {
  if (admin.role === 'super_admin') return true;
  if (admin.role === 'admin') return ['view_users', 'manage_payments'].includes(permission);
  if (admin.role === 'moderator') return ['view_users'].includes(permission);
  return false;
}
