export default function AboutPage() {
	return (
		<>
			{/* About Section */}
			<section className="py-20">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">
							About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Neurativo</span>
						</h1>
						<p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
							Neurativo is on a mission to transform education through AI-powered learning experiences that adapt to every learner's unique needs and pace.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
							<div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
								<i className="fas fa-brain text-2xl text-white"></i>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
							<p className="text-gray-300 leading-relaxed">
								To democratize education by making personalized, AI-powered learning accessible to everyone, regardless of their background or learning style.
							</p>
						</div>

						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
							<div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
								<i className="fas fa-rocket text-2xl text-white"></i>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
							<p className="text-gray-300 leading-relaxed">
								A world where every learner has access to intelligent, adaptive educational tools that make learning engaging, effective, and personalized.
							</p>
						</div>
					</div>

					<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 mb-16">
						<h2 className="text-3xl font-bold text-white mb-6">What We Do</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">AI-Powered Quiz Generation</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Create personalized quizzes from any content - PDFs, documents, URLs, or text. Our AI understands context and generates relevant questions.
								</p>
							</div>
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">Live Lecture Assistant</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Real-time transcription, note-taking, and flashcard generation during live lectures or meetings.
								</p>
							</div>
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">Study Pack Creation</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Generate comprehensive study materials including detailed notes, flashcards, and practice quizzes.
								</p>
							</div>
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">Progress Tracking</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Monitor your learning progress with detailed analytics and personalized recommendations.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-20 bg-gradient-to-b from-black/20 to-black/40">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
							Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Questions</span>
						</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Can I change plans anytime?</h3>
							<p className="text-gray-300">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">What payment methods do you accept?</h3>
							<p className="text-gray-300">We accept all major credit cards, PayPal, and cryptocurrency payments for maximum flexibility.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Is there a free trial?</h3>
							<p className="text-gray-300">Yes! Our Essential plan gives you full access to core features with generous usage limits to get started.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Can I cancel anytime?</h3>
							<p className="text-gray-300">Absolutely! Cancel anytime with no questions asked. Your data remains accessible until your billing period ends.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">How does the AI work?</h3>
							<p className="text-gray-300">Our AI uses advanced natural language processing to understand content and generate relevant, personalized learning materials.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Is my data secure?</h3>
							<p className="text-gray-300">Yes! We use enterprise-grade security measures and encryption to protect your data and privacy.</p>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}


