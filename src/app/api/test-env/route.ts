import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const envCheck = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openai_key: !!process.env.OPENAI_API_KEY,
    openai_model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  };

  return NextResponse.json({ 
    success: true, 
    data: envCheck,
    message: "Environment variables check"
  });
}
