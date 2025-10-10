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
								href="https://instagram.com/neurativo.official" 
								target="_blank" 
								rel="noopener noreferrer"
								className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
								aria-label="Follow us on Instagram"
							>
								<i className="fab fa-instagram text-white text-lg"></i>
							</a>
							<a 
								href="https://facebook.com/neurativo.official" 
								target="_blank" 
								rel="noopener noreferrer"
								className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
								aria-label="Follow us on Facebook"
							>
								<i className="fab fa-facebook-f text-white text-lg"></i>
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


