import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Neurativo",
		short_name: "Neurativo",
		description:
			"AI-powered learning platform with smart quiz generation, analysis, and insights.",
		start_url: "/",
		display: "standalone",
		background_color: "#0f172a",
		theme_color: "#7c3aed",
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
			},
			{
				src: "/icons/maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
