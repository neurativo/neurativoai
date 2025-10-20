import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = getSupabaseService();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 });
    }

    // Current plan from user_subscriptions
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select(`
        subscription_plans!inner(
          name
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const currentPlan = (subscription?.subscription_plans as any)?.name?.toLowerCase() || "free";

    // Get plan limits from subscription_plans (case-insensitive by name)
    const { data: planData } = await supabase
      .from("subscription_plans")
      .select("monthly_limit, daily_limit, features, name")
      .ilike("name", currentPlan)
      .maybeSingle();

    // Period start (YYYY-MM-01)
    const monthDate = new Date();
    monthDate.setDate(1);
    const monthStart = monthDate.toISOString().split('T')[0];

    // Read monthly usage from user_usage
    const { data: uu } = await supabase
      .from('user_usage')
      .select('used_count')
      .eq('user_id', user.id)
      .eq('month_start', monthStart)
      .maybeSingle();

    const monthly_used = uu?.used_count ?? 0;
    const monthly_limit = planData?.monthly_limit ?? 20;

    // Read source-specific usage from user_source_usage
    const { data: sourceUsageData } = await supabase
      .from('user_source_usage')
      .select('source_type, used_count')
      .eq('user_id', user.id)
      .eq('month_start', monthStart);

    const sourceUsage = {
      url: sourceUsageData?.find(s => s.source_type === 'url')?.used_count ?? 0,
      text: sourceUsageData?.find(s => s.source_type === 'text')?.used_count ?? 0,
      document: sourceUsageData?.find(s => s.source_type === 'document')?.used_count ?? 0
    };

    // Derive source limits from features if available, otherwise defaults
    const parsedFeatures = Array.isArray(planData?.features) ? planData?.features : [];
    const sourceLimits = {
      url: parsedFeatures.includes('All quiz types') ? Math.max(5, Math.round((planData?.daily_limit ?? 5) / 3)) : 5,
      text: parsedFeatures.includes('All quiz types') ? Math.max(10, Math.round((planData?.daily_limit ?? 5) / 2)) : 10,
      document: parsedFeatures.includes('All quiz types') ? Math.max(5, Math.round((planData?.daily_limit ?? 5) / 3)) : 5
    };

    // Read daily usage from user_daily_usage
    const today = new Date().toISOString().split('T')[0];
    const { data: du } = await supabase
      .from('user_daily_usage')
      .select('used_count')
      .eq('user_id', user.id)
      .eq('day', today)
      .maybeSingle();
    const daily_used = du?.used_count ?? 0;
    const daily_limit = planData?.daily_limit ?? 5;

    // Read daily source-specific usage
    const { data: dailySourceUsageData } = await supabase
      .from('user_daily_source_usage')
      .select('source_type, used_count')
      .eq('user_id', user.id)
      .eq('day', today);

    const dailySourceUsage = {
      url: dailySourceUsageData?.find(s => s.source_type === 'url')?.used_count ?? 0,
      text: dailySourceUsageData?.find(s => s.source_type === 'text')?.used_count ?? 0,
      document: dailySourceUsageData?.find(s => s.source_type === 'document')?.used_count ?? 0
    };

    return NextResponse.json({
      success: true,
      data: {
        plan: currentPlan,
        monthly_quiz_generations: monthly_limit,
        max_questions_per_quiz: parsedFeatures.includes('Advanced analytics') ? 20 : 10,
        monthly_used,
        monthly_limit,
        daily_used,
        daily_limit,
        source_usage: sourceUsage,
        source_limits: sourceLimits,
        daily_source_usage: dailySourceUsage,
        daily_source_limits: {
          url: sourceLimits.url,
          text: sourceLimits.text,
          document: sourceLimits.document
        }
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Failed to load usage" }, { status: 500 });
  }
}


