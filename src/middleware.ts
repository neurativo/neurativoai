import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory token bucket per IP (ephemeral on edge; good enough for burst control)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests/min per IP for API
const apiBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function isBadBot(ua: string | null): boolean {
	if (!ua) return false;
	const s = ua.toLowerCase();
	return (
		s.includes("curl/") ||
		s.includes("wget/") ||
		s.includes("python-requests") ||
		s.includes("libwww-perl") ||
		s.includes("scrapy") ||
		s.includes("httpclient")
	);
}

function takeToken(ip: string): boolean {
	const now = Date.now();
	let bucket = apiBuckets.get(ip);
	if (!bucket) {
		bucket = { tokens: RATE_LIMIT_MAX, lastRefill: now };
		apiBuckets.set(ip, bucket);
	}
	// Refill
	const elapsed = now - bucket.lastRefill;
	if (elapsed > RATE_LIMIT_WINDOW_MS) {
		bucket.tokens = RATE_LIMIT_MAX;
		bucket.lastRefill = now;
	}
	if (bucket.tokens <= 0) return false;
	bucket.tokens -= 1;
	return true;
}

export const config = {
	matcher: [
		"/api/:path*",
	],
};

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const ua = req.headers.get("user-agent");
	if (isBadBot(ua)) {
		return new NextResponse("Blocked", { status: 403 });
	}
	// Only rate-limit heavy endpoints
	if (pathname.startsWith("/api/quiz")) {
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
		if (!takeToken(ip)) {
			return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
		}
	}
	return NextResponse.next();
}
