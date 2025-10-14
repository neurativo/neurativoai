import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Redirect to the actual favicon with cache busting
  return NextResponse.redirect(new URL('/favicon.ico?v=8', req.url), 302);
}
