import { getSupabaseServer } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  created_at: string;
  last_login: string;
  is_active: boolean;
}

export interface AdminPermissions {
  user_management: boolean;
  payment_management: boolean;
  site_customization: boolean;
  analytics_access: boolean;
  maintenance_mode: boolean;
  security_logs: boolean;
  api_management: boolean;
}

const ROLE_PERMISSIONS: Record<string, AdminPermissions> = {
  super_admin: {
    user_management: true,
    payment_management: true,
    site_customization: true,
    analytics_access: true,
    maintenance_mode: true,
    security_logs: true,
    api_management: true,
  },
  admin: {
    user_management: true,
    payment_management: true,
    site_customization: true,
    analytics_access: true,
    maintenance_mode: false,
    security_logs: false,
    api_management: false,
  },
  moderator: {
    user_management: false,
    payment_management: false,
    site_customization: false,
    analytics_access: true,
    maintenance_mode: false,
    security_logs: false,
    api_management: false,
  },
};

export async function verifyAdminAccess(token: string): Promise<AdminUser | null> {
  try {
    const supabase = getSupabaseServer();
    
    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return null;
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      return null;
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', user.id);

    return {
      id: user.id,
      email: user.email || '',
      role: adminData.role,
      permissions: Object.entries(ROLE_PERMISSIONS[adminData.role])
        .filter(([_, hasPermission]) => hasPermission)
        .map(([permission]) => permission),
      created_at: adminData.created_at,
      last_login: new Date().toISOString(),
      is_active: adminData.is_active,
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return null;
  }
}

export function hasPermission(admin: AdminUser, permission: keyof AdminPermissions): boolean {
  return admin.permissions.includes(permission);
}

export function requireAdminPermission(admin: AdminUser, permission: keyof AdminPermissions): boolean {
  if (!hasPermission(admin, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
  return true;
}

// Security logging
export async function logAdminAction(
  adminId: string, 
  action: string, 
  details: Record<string, any> = {},
  ipAddress?: string
) {
  try {
    const supabase = getSupabaseServer();
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      details,
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
