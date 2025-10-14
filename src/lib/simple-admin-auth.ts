// Simple admin authentication without complex Supabase client-side auth

export interface SimpleAdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export function getAdminSession(): SimpleAdminUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const session = localStorage.getItem('admin_session');
    if (!session) return null;
    
    const parsed = JSON.parse(session);
    
    // Check if session is not expired (24 hours)
    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem('admin_session');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing admin session:', error);
    localStorage.removeItem('admin_session');
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_session');
}

export function hasAdminPermission(admin: SimpleAdminUser | null, permission: string): boolean {
  if (!admin) return false;
  
  const permissions: Record<string, Record<string, boolean>> = {
    super_admin: {
      can_manage_users: true,
      can_manage_payments: true,
      can_manage_settings: true,
      can_view_analytics: true
    },
    admin: {
      can_manage_users: true,
      can_manage_payments: true,
      can_manage_settings: false,
      can_view_analytics: true
    },
    moderator: {
      can_manage_users: false,
      can_manage_payments: false,
      can_manage_settings: false,
      can_view_analytics: true
    }
  };
  
  return permissions[admin.role]?.[permission] === true;
}
