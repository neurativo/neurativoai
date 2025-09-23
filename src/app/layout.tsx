import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Aurora from "./components/Aurora";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Neurativo - AI-Powered Learning Platform",
	description: "Transform your learning experience with AI-powered quizzes, intelligent progress tracking, and gamified challenges that adapt to your pace.",
	metadataBase: new URL("https://neurativo.ai"),
	alternates: {
		canonical: "/",
	},
	keywords: [
		"Neurativo",
		"AI quizzes",
		"quiz generator",
		"study tools",
		"learning platform",
		"edtech",
		"practice questions",
		"flashcards",
	],
	openGraph: {
		type: "website",
		title: "Neurativo - AI-Powered Learning Platform",
		description:
			"Transform your learning experience with AI-powered quizzes, intelligent progress tracking, and gamified challenges that adapt to your pace.",
		url: "https://neurativo.ai/",
		siteName: "Neurativo",
		images: [
			{
				url: "/og/neurativo-og.png",
				width: 1200,
				height: 630,
				alt: "Neurativo - AI-Powered Learning Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Neurativo - AI-Powered Learning Platform",
		description:
			"Transform your learning experience with AI-powered quizzes, intelligent progress tracking, and gamified challenges that adapt to your pace.",
		images: ["/og/neurativo-og.png"],
	},
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [
			{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
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
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
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
