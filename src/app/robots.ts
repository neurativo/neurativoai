import type { MetadataRoute } from "next";

function getWwwBase(): string {
	const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.neurativo.com";
	try {
		const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
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

export default function robots(): MetadataRoute.Robots {
	const baseUrl = getWwwBase();
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
		],
		host: baseUrl,
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
