import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Aurora from "./components/Aurora";
import PerformanceOptimizer from "./components/PerformanceOptimizer";
import Chatbot from "./components/Chatbot";

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
			{ url: "/favicon1.ico", sizes: "any" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/logo.png", sizes: "192x192", type: "image/png" },
		],
		shortcut: "/favicon1.ico",
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
		"mobile-web-app-capable": "yes",
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
				
				{/* AGGRESSIVE FAVICON OVERRIDE - Using favicon1.ico to bypass Vercel cache */}
				<link rel="icon" type="image/x-icon" href="/favicon1.ico" />
				<link rel="shortcut icon" type="image/x-icon" href="/favicon1.ico" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="192x192" href="/logo.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				
				{/* Force favicon for all browsers - using favicon1.ico */}
				<link rel="icon" href="/favicon1.ico" sizes="any" />
				<link rel="shortcut icon" href="/favicon1.ico" />
				<link rel="bookmark" href="/favicon1.ico" />
				
				{/* Additional SEO meta tags for favicon */}
				<meta name="msapplication-TileImage" content="/logo.png" />
				<meta name="msapplication-TileColor" content="#8b5cf6" />
				<meta name="theme-color" content="#8b5cf6" />
				
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
				/>
				
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "EducationalOrganization",
							"name": "Neurativo",
							"url": "https://www.neurativo.com",
							"logo": "https://www.neurativo.com/logo.png",
							"description": "Neurativo is an AI-powered education platform that transforms the way students learn through intelligent insights, adaptive study experiences, and personalized guidance.",
							"founder": [
								{
									"@type": "Person",
									"name": "Shazad Arshad"
								},
								{
									"@type": "Person",
									"name": "Shariff Ahamed"
								}
							],
							"foundingDate": "2025",
							"sameAs": [
								"https://www.instagram.com/neurativo.official",
								"https://www.facebook.com/neurativo.official",
								"https://www.linkedin.com/company/neurativo"
							],
							"offers": [
								{
									"@type": "Offer",
									"name": "AI Learning Plans",
									"priceSpecification": {
										"@type": "PriceSpecification",
										"priceCurrency": "USD",
										"price": "Varies",
										"priceType": "startingFrom",
										"description": "Flexible subscription options for students and institutions."
									},
									"availability": "https://schema.org/InStock"
								}
							],
							"brand": {
								"@type": "Brand",
								"name": "Neurativo",
								"slogan": "Transforming Education with Intelligence"
							},
							"address": {
								"@type": "PostalAddress",
								"addressCountry": "LK"
							}
						})
					}}
				/>
			</head>
		<body
			className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
		>
			<PerformanceOptimizer />
			<Navbar />
			<Aurora colorStops={["#D946EF", "#8B5CF6", "#3B82F6"]} amplitude={1.3} blend={0.65} speed={0.5} />
			<main className="relative z-30 pt-16 md:pt-16 pb-20 md:pb-0">
				{children}
			</main>
			<Footer />
			<Chatbot />
		</body>
		</html>
	);
}
