import type { MetadataRoute } from "next";

function getWwwBase(): string {
	const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.neurativo.com";
	try {
		const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
		// Ensure www. prefix
		if (!u.hostname.startsWith("www.")) {
			u.hostname = `www.${u.hostname}`;
		}
		u.protocol = "https:";
		u.pathname = "/";
		return u.toString().replace(/\/$/, "");
	} catch {
		return "https://www.neurativo.com";
	}
}

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = getWwwBase();
	const now = new Date();
	return [
		{ url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
		{ url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
		{ url: `${baseUrl}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
		{ url: `${baseUrl}/quiz`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
		{ url: `${baseUrl}/library`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
		{ url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
		{ url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
		{ url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
	];
}
