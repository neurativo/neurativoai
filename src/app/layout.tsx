import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Aurora from "./components/Aurora";

const inter = Inter({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "arial"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
	fallback: ["monospace"],
});

export const metadata: Metadata = {
	title: {
		default: "Neurativo - AI-Powered Learning Platform",
		template: "%s | Neurativo"
	},
	description: "Transform your learning with AI-generated quizzes, live lectures, and personalized study materials. Master any subject with intelligent learning that adapts to your pace. Join 10,000+ students already using our revolutionary platform.",
	metadataBase: new URL("https://www.neurativo.com"),
	alternates: { 
		canonical: "/",
		languages: {
			'en-US': '/en-US',
			'es-ES': '/es-ES',
		},
	},
	keywords: [
		"AI learning",
		"educational technology",
		"personalized quizzes",
		"study tools",
		"online learning",
		"artificial intelligence",
		"learning platform",
		"quiz generator",
		"study materials",
		"educational AI",
		"live lecture assistant",
		"study pack generator",
		"flashcard maker",
		"exam preparation",
		"student success",
		"adaptive learning",
		"intelligent tutoring",
		"academic performance",
		"learning analytics",
		"study optimization",
		"Neurativo",
		"AI quizzes",
		"edtech",
		"practice questions",
		"flashcards",
		"neurativo official",
		"neurativo instagram",
		"neurativo facebook",
		"neurativo social media",
		"neurativo sitemap",
	],
	authors: [{ name: "Neurativo Team" }],
	creator: "Neurativo",
	publisher: "Neurativo",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		title: "Neurativo - AI-Powered Learning Platform",
		description: "Transform your learning with AI-generated quizzes, live lectures, and personalized study materials. Join 10,000+ students already using our revolutionary platform.",
		url: "https://www.neurativo.com/",
		siteName: "Neurativo",
		images: [
			{ 
				url: "/og-image.jpg", 
				width: 1200, 
				height: 630, 
				alt: "Neurativo - AI-Powered Learning Platform",
				type: "image/jpeg"
			},
		],
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "Neurativo - AI-Powered Learning Platform",
		description: "Transform your learning with AI-generated quizzes, live lectures, and personalized study materials.",
		images: ["/twitter-image.jpg"],
		creator: "@neurativo",
		site: "@neurativo",
	},
	robots: {
		index: true,
		follow: true,
		nocache: true,
		googleBot: {
			index: true,
			follow: true,
			noimageindex: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "your-google-verification-code",
		yandex: "your-yandex-verification-code",
		yahoo: "your-yahoo-verification-code",
	},
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		shortcut: "/favicon.ico",
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
		other: [
			{
				rel: "mask-icon",
				url: "/safari-pinned-tab.svg",
				color: "#8b5cf6",
			},
		],
	},
	manifest: "/manifest.json",
	category: "education",
	classification: "Educational Technology",
	other: {
		"msapplication-TileColor": "#8b5cf6",
		"theme-color": "#8b5cf6",
		"apple-mobile-web-app-capable": "yes",
		"apple-mobile-web-app-status-bar-style": "black-translucent",
		"apple-mobile-web-app-title": "Neurativo",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta name="permissions-policy" content="microphone=(self)" />
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "Organization",
							"name": "Neurativo",
							"description": "AI-powered learning platform that transforms education through personalized quizzes, live lectures, and intelligent study materials.",
							"url": "https://www.neurativo.com",
							"logo": "https://www.neurativo.com/logo.png",
							"foundingDate": "2024",
							"founders": [
								{
									"@type": "Person",
									"name": "Neurativo Team"
								}
							],
							"sameAs": [
								"https://instagram.com/neurativo.official",
								"https://facebook.com/neurativo.official"
							],
							"contactPoint": {
								"@type": "ContactPoint",
								"contactType": "customer service",
								"email": "support@neurativo.com"
							},
							"offers": {
								"@type": "Offer",
								"description": "AI-powered learning platform with personalized quizzes and study materials",
								"price": "0",
								"priceCurrency": "USD"
							},
							"areaServed": "Worldwide",
							"serviceType": "Educational Technology"
						})
					}}
				/>
			</head>
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
			>
				<Navbar />
				<Aurora colorStops={["#D946EF", "#8B5CF6", "#3B82F6"]} amplitude={1.3} blend={0.65} speed={0.5} />
				<main className="relative z-30 pt-16 md:pt-16 pb-20 md:pb-0">
					{children}
				</main>
				<Footer />
			</body>
		</html>
	);
}
