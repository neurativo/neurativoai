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
			// Single SVG to avoid 404s while assets are being prepared
			{ src: "/file.svg", sizes: "any", type: "image/svg+xml" },
		],
	};
}
