export default function Footer() {
	return (
		<footer className="bg-white/5 backdrop-blur-xl border-t border-white/20 py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<div className="lg:col-span-1">
						<div className="flex items-center space-x-3 mb-6">
							<div className="w-10 h-10 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-xl">N</span>
							</div>
							<span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">Neurativo</span>
						</div>
						<p className="text-gray-300 mb-6 leading-relaxed">
							Transforming education through AI-powered learning. Experience personalized quizzes, intelligent progress tracking, and gamified learning that adapts to you.
						</p>
					</div>
					<div>
						<h4 className="text-lg font-semibold text-white mb-6">Product</h4>
						<ul className="space-y-4">
							<li><a href="#features" className="footer-link">Features</a></li>
							<li><a href="/quiz" className="footer-link">Create Quiz</a></li>
							<li><a href="/library" className="footer-link">Library</a></li>
							<li><a href="/pricing" className="footer-link">Pricing</a></li>
						</ul>
					</div>
					<div>
						<h4 className="text-lg font-semibold text-white mb-6">Legal</h4>
						<ul className="space-y-4">
							<li><a href="/privacy" className="footer-link">Privacy Policy</a></li>
							<li><a href="/terms" className="footer-link">Terms of Service</a></li>
							<li><a href="/about" className="footer-link">About</a></li>
						</ul>
					</div>
					<div>
						<h4 className="text-lg font-semibold text-white mb-6">Follow Us</h4>
						<div className="flex space-x-4">
							<a 
								href="https://www.instagram.com/neurativo.official" 
								target="_blank" 
								rel="noopener noreferrer"
								className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25"
								aria-label="Follow us on Instagram"
							>
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
								</svg>
							</a>
							<a 
								href="https://www.facebook.com/neurativo.official" 
								target="_blank" 
								rel="noopener noreferrer"
								className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
								aria-label="Follow us on Facebook"
							>
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
								</svg>
							</a>
							<a 
								href="https://www.linkedin.com/company/neurativo" 
								target="_blank" 
								rel="noopener noreferrer"
								className="w-12 h-12 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25"
								aria-label="Follow us on LinkedIn"
							>
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
								</svg>
							</a>
							<a 
								href="https://twitter.com/neurativo" 
								target="_blank" 
								rel="noopener noreferrer"
								className="w-12 h-12 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/25"
								aria-label="Follow us on Twitter"
							>
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
								</svg>
							</a>
						</div>
						<p className="text-gray-400 text-sm mt-4">
							Stay updated with our latest features and educational content
						</p>
					</div>
				</div>
				<div className="border-t border-white/10 mt-12 pt-8">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<p className="text-gray-300">&copy; 2025 Neurativo. All rights reserved.</p>
						<div className="flex space-x-6 mt-4 md:mt-0">
							<a href="/terms" className="footer-link-small">Terms of Service</a>
							<a href="/privacy" className="footer-link-small">Privacy Policy</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}


