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
    const periodStart = monthDate.toISOString().split('T')[0];

    // Read monthly usage from new table
    const { data: mqu } = await supabase
      .from('monthly_quiz_usage')
      .select('used_count, plan_limit')
      .eq('user_id', user.id)
      .eq('period_start', periodStart)
      .maybeSingle();

    const monthly_used = mqu?.used_count ?? 0;
    const monthly_limit = mqu?.plan_limit ?? (planData?.monthly_quiz_generations ?? 20);

    return NextResponse.json({
      success: true,
      data: {
        plan: currentPlan,
        monthly_quiz_generations: planData?.monthly_quiz_generations ?? 20,
        max_questions_per_quiz: planData?.max_questions_per_quiz ?? 8,
        monthly_used,
        monthly_limit,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Failed to load usage" }, { status: 500 });
  }
}


