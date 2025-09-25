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

    // Plan limits
    const { data: planData } = await supabase
      .from("plans").select("monthly_quiz_generations, max_questions_per_quiz").eq("key", currentPlan).maybeSingle();
    const dailyLimits: Record<string, number> = { free: 5, plus: 20, premium: 50, pro: 100 };
    const dailyLimit = dailyLimits[currentPlan] ?? 5;

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

    // Read daily usage from user_daily_usage
    const today = new Date().toISOString().split('T')[0];
    const { data: du } = await supabase
      .from('user_daily_usage')
      .select('used_count')
      .eq('user_id', user.id)
      .eq('day', today)
      .maybeSingle();
    const daily_used = du?.used_count ?? 0;
    const dailyLimits: Record<string, number> = { free: 5, plus: 20, premium: 50, pro: 100 };
    const daily_limit = dailyLimits[currentPlan] ?? 5;

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
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Failed to load usage" }, { status: 500 });
  }
}


