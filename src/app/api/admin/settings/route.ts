import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyAdminAccess, hasPermission, logAdminAction } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const adminAccess = await verifyAdminAccess(token);

    if (!adminAccess.isAdmin || !adminAccess.user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!hasPermission(adminAccess.user.id, 'site_customization')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = getSupabaseServer();

    // Get maintenance mode settings
    const { data: maintenanceMode } = await supabase
      .from('maintenance_mode')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Get feature flags
    const { data: featureFlags } = await supabase
      .from('feature_flags')
      .select('*');

    // Get site settings
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('*');

    // Convert feature flags to object
    const flagsObject: Record<string, boolean> = {};
    featureFlags?.forEach(flag => {
      flagsObject[flag.name] = flag.is_enabled;
    });

    // Convert site settings to object
    const settingsObject: Record<string, any> = {};
    siteSettings?.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    const settings = {
      maintenanceMode: maintenanceMode?.is_enabled || false,
      maintenanceMessage: maintenanceMode?.message || 'We are currently performing scheduled maintenance. Please check back soon.',
      allowedIPs: maintenanceMode?.allowed_ips || [],
      featureFlags: flagsObject,
      siteTitle: settingsObject.site_title || 'Neurativo',
      siteDescription: settingsObject.site_description || 'AI-Powered Learning Platform',
      maxFileSize: settingsObject.max_file_size || 10,
      maxQuestionsPerQuiz: settingsObject.max_questions_per_quiz || 20,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const adminAccess = await verifyAdminAccess(token);

    if (!adminAccess.isAdmin || !adminAccess.user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!hasPermission(adminAccess.user.id, 'site_customization')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { settings } = await req.json();
    const supabase = getSupabaseServer();

    // Update maintenance mode
    await supabase
      .from('maintenance_mode')
      .upsert({
        is_enabled: settings.maintenanceMode,
        message: settings.maintenanceMessage,
        allowed_ips: settings.allowedIPs,
        updated_by: adminAccess.user.id,
        updated_at: new Date().toISOString(),
      });

    // Update feature flags
    for (const [flagName, isEnabled] of Object.entries(settings.featureFlags)) {
      await supabase
        .from('feature_flags')
        .upsert({
          name: flagName,
          is_enabled: isEnabled,
          updated_by: adminAccess.user.id,
          updated_at: new Date().toISOString(),
        });
    }

    // Update site settings
    const siteSettingsUpdates = [
      { key: 'site_title', value: settings.siteTitle },
      { key: 'site_description', value: settings.siteDescription },
      { key: 'max_file_size', value: settings.maxFileSize },
      { key: 'max_questions_per_quiz', value: settings.maxQuestionsPerQuiz },
    ];

    for (const setting of siteSettingsUpdates) {
      await supabase
        .from('site_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          updated_by: adminAccess.user.id,
          updated_at: new Date().toISOString(),
        });
    }

    // Log admin action
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await logAdminAction(adminAccess.user.id, 'update_site_settings', 'settings', undefined, { settings }, clientIP);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
