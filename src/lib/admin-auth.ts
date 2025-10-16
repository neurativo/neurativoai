import { getSupabaseBrowser } from './supabase';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function checkAdminStatus(): Promise<AdminUser | null> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return null;
    }

    return adminUser;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return null;
  }
}

export async function loginAsAdmin(email: string, password: string): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if user is admin
    const adminUser = await checkAdminStatus();
    if (!adminUser) {
      // Sign out if not admin
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    return { success: true, admin: adminUser };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function logoutAdmin(): Promise<void> {
  const supabase = getSupabaseBrowser();
  await supabase.auth.signOut();
  localStorage.removeItem('admin');
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin') !== null;
}

export function getStoredAdmin(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const adminData = localStorage.getItem('admin');
  return adminData ? JSON.parse(adminData) : null;
}
