import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseServer() {
  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export interface AdminUser {
  id: string
  role: string
  email: string
  is_active: boolean
  created_at: string
  last_login_at?: string
}

export interface AdminRole {
  id: string
  name: string
  permissions: Record<string, boolean>
}

function getRolePermissions(role: string): Record<string, boolean> {
  const permissions: Record<string, boolean> = {
    can_manage_users: false,
    can_manage_payments: false,
    can_manage_settings: false,
    can_view_analytics: false
  }

  switch (role) {
    case 'super_admin':
      permissions.can_manage_users = true
      permissions.can_manage_payments = true
      permissions.can_manage_settings = true
      permissions.can_view_analytics = true
      break
    case 'admin':
      permissions.can_manage_users = true
      permissions.can_manage_payments = true
      permissions.can_manage_settings = false
      permissions.can_view_analytics = true
      break
    case 'moderator':
      permissions.can_manage_users = false
      permissions.can_manage_payments = false
      permissions.can_manage_settings = false
      permissions.can_view_analytics = true
      break
  }

  return permissions
}

export interface AdminAction {
  id: string
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

/**
 * Verify if the current user has admin access
 */
export async function verifyAdminAccess(token?: string): Promise<{ 
  isAdmin: boolean; 
  user?: AdminUser; 
  role?: AdminRole 
}> {
  try {
    if (!token) {
      return { isAdmin: false }
    }

    const supabase = getSupabaseServer()
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return { isAdmin: false }
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        created_at,
        last_login
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return { isAdmin: false }
    }

    return {
      isAdmin: true,
      user: {
        id: adminUser.user_id,
        role: adminUser.role,
        email: user.email || '',
        is_active: adminUser.is_active,
        created_at: adminUser.created_at,
        last_login_at: adminUser.last_login
      },
      role: {
        id: adminUser.id,
        name: adminUser.role,
        permissions: getRolePermissions(adminUser.role)
      }
    }
  } catch (error) {
    console.error('Error verifying admin access:', error)
    return { isAdmin: false }
  }
}

/**
 * Get admin user details
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const supabase = getSupabaseServer()
    
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        role,
        email,
        is_active,
        created_at,
        last_login_at
      `)
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting admin user:', error)
    return null
  }
}

/**
 * Get admin role details
 */
export async function getAdminRole(roleId: string): Promise<AdminRole | null> {
  try {
    const supabase = getSupabaseServer()
    
    const { data, error } = await supabase
      .from('admin_roles')
      .select('id, name, permissions')
      .eq('id', roleId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting admin role:', error)
    return null
  }
}

/**
 * Check if admin has specific permission (async version)
 */
export async function hasPermission(
  adminId: string, 
  permission: string
): Promise<boolean> {
  try {
    const adminUser = await getAdminUser(adminId)
    if (!adminUser) return false

    const role = await getAdminRole(adminUser.role)
    if (!role) return false

    return role.permissions[permission] === true
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Check if admin has specific permission (sync version using role data)
 */
export function hasPermissionSync(
  admin: AdminUser | null,
  role: AdminRole | null | undefined,
  permission: string
): boolean {
  if (!admin || !role) return false
  return role.permissions[permission] === true
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = getSupabaseServer()
    
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      })
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}

/**
 * Update admin last login time
 */
export async function updateAdminLastLogin(adminId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer()
    
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminId)
  } catch (error) {
    console.error('Error updating admin last login:', error)
  }
}
