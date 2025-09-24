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

    // Dates
    const today = new Date().toISOString().split('T')[0];
    const monthDate = new Date();
    monthDate.setDate(1);
    const currentMonth = monthDate.toISOString().split('T')[0];

    // Usage counts
    const [{ data: m }, { data: d }] = await Promise.all([
      supabase.from("usage_counters").select("count").eq("user_id", user.id).eq("counter_type", "monthly_quiz_generations").eq("date", currentMonth).maybeSingle(),
      supabase.from("usage_counters").select("count").eq("user_id", user.id).eq("counter_type", "daily_quiz_generations").eq("date", today).maybeSingle(),
    ]);

    // Ensure we never return negative or undefined
    const monthly_used = typeof m?.count === 'number' && m.count > 0 ? m.count : 0;
    const daily_used = typeof d?.count === 'number' && d.count > 0 ? d.count : 0;

    return NextResponse.json({
      success: true,
      data: {
        plan: currentPlan,
        monthly_quiz_generations: planData?.monthly_quiz_generations ?? 20,
        max_questions_per_quiz: planData?.max_questions_per_quiz ?? 8,
        monthly_used,
        daily_used,
        daily_limit: dailyLimit,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Failed to load usage" }, { status: 500 });
  }
}


