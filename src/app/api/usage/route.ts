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

    // Current plan
    const { data: subscription } = await supabase
      .from("subscriptions").select("plan").eq("user_id", user.id).eq("status", "active").maybeSingle();
    const currentPlan = subscription?.plan || "free";

    // Comprehensive plan limits
    const { data: planData } = await supabase
      .from("plans")
      .select("monthly_quiz_generations, max_questions_per_quiz, url_quiz_limit, text_quiz_limit, document_quiz_limit, daily_quiz_generations")
      .eq("key", currentPlan)
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
    const monthly_limit = planData?.monthly_quiz_generations ?? 20;

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

    const sourceLimits = {
      url: planData?.url_quiz_limit ?? 5,
      text: planData?.text_quiz_limit ?? 10,
      document: planData?.document_quiz_limit ?? 5
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
    const daily_limit = planData?.daily_quiz_generations ?? 5;

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
        monthly_quiz_generations: planData?.monthly_quiz_generations ?? 20,
        max_questions_per_quiz: planData?.max_questions_per_quiz ?? 8,
        monthly_used,
        monthly_limit,
        daily_used,
        daily_limit,
        source_usage: sourceUsage,
        source_limits: sourceLimits,
        daily_source_usage: dailySourceUsage,
        daily_source_limits: {
          url: planData?.daily_quiz_generations ?? 5,
          text: planData?.daily_quiz_generations ?? 5,
          document: planData?.daily_quiz_generations ?? 5
        }
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Failed to load usage" }, { status: 500 });
  }
}


